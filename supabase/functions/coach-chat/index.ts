/**
 * Supabase Edge Function — AI Coach Chat
 *
 * Proxy for OpenAI chat completions, used by the Coach Context Manager.
 * Handles API key management server-side.
 *
 * POST /coach-chat
 * Body: { messages: ChatMessage[], model: string }
 * Response: { reply: string }
 */

// @ts-nocheck — Deno runtime types
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the user from the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      throw new Error('Invalid token or user not found');
    }

    // Check usage limits and subscription status
    const { data: usageData, error: usageError } = await supabase
      .rpc('check_and_reset_ai_usage', { user_uuid: user.id });

    if (usageError) throw usageError;
    const { status, usage_count } = usageData[0];

    // Limit check for Free users
    const MAX_FREE_MESSAGES = 5;
    if (status === 'free' && usage_count >= MAX_FREE_MESSAGES) {
      return new Response(
        JSON.stringify({ 
          error: 'Daily AI limit reached', 
          code: 'LIMIT_REACHED',
          message: 'Günlük AI limitine ulaştın. Sınırsız sohbet için Premium\'a geç!' 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { messages, model } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'messages array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    // Filter available providers based on configured API keys
    const availableProviders = [];
    if (openaiApiKey) availableProviders.push('openai');
    if (deepseekApiKey) availableProviders.push('deepseek');
    if (geminiApiKey) availableProviders.push('gemini');

    if (availableProviders.length === 0) {
      throw new Error('No AI provider API keys are configured (OpenAI, DeepSeek, Gemini).');
    }

    // Shuffle providers to achieve load balancing
    const shuffledProviders = availableProviders.sort(() => Math.random() - 0.5);
    
    // Variables for fallback tracking
    let lastError = null;
    let reply = null;
    let successfulProvider = null;

    for (const provider of shuffledProviders) {
      try {
        console.log(`[coach-chat] Attempting chat completion with provider: ${provider}`);
        
        if (provider === 'openai') {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: model ?? 'gpt-4o',
              messages,
              max_tokens: 800,
              temperature: 0.7,
            }),
          });
          if (!response.ok) throw new Error(`OpenAI error: ${response.status} ${await response.text()}`);
          const result = await response.json();
          reply = result.choices?.[0]?.message?.content;
        } 
        
        else if (provider === 'deepseek') {
          const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${deepseekApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'deepseek-chat',
              messages,
              max_tokens: 800,
              temperature: 0.7,
            }),
          });
          if (!response.ok) throw new Error(`DeepSeek error: ${response.status} ${await response.text()}`);
          const result = await response.json();
          reply = result.choices?.[0]?.message?.content;
        }

        else if (provider === 'gemini') {
          // Flatten messages for Gemini API
          const geminiMessages = messages.map((m: any) => ({
             role: m.role === 'assistant' ? 'model' : m.role,
             parts: [{ text: m.content }]
          }));

          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: geminiMessages,
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 800,
              }
            }),
          });

          if (!response.ok) throw new Error(`Gemini error: ${response.status} ${await response.text()}`);
          const result = await response.json();
          reply = result.candidates?.[0]?.content?.parts?.[0]?.text;
        }

        if (reply) {
          successfulProvider = provider;
          break; // Success! Break out of the fallback loop.
        }
      } catch (err: any) {
        console.warn(`[coach-chat] Provider ${provider} failed:`, err.message);
        lastError = err;
        // Continue to the next provider
      }
    }

    if (!reply) {
      throw new Error(`All available AI providers failed. Last error: ${lastError?.message}`);
    }

    // Increment usage count for Free users
    if (status === 'free') {
      await supabase
        .from('users')
        .update({ 
          daily_ai_usage_count: usage_count + 1,
          last_ai_usage_at: new Date().toISOString()
        })
        .eq('id', user.id);
    }

    return new Response(
      JSON.stringify({ reply, provider: successfulProvider }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('[coach-chat] Critical Error:', error.message);
    const errorMsg = error.message || 'Unknown error';
    const isClientError = errorMsg.includes('required') || errorMsg.includes('not found') || errorMsg.includes('quota') || errorMsg.includes('limit') || errorMsg.includes('Daily AI limit');
    const safeErrorMsg = isClientError ? errorMsg : 'An internal server error occurred while processing your request. Please try again later.';

    return new Response(
      JSON.stringify({ error: safeErrorMsg }),
      {
        status: errorMsg.includes('limit') ? 403 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
