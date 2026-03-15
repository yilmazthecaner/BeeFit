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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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
    const isClientError = errorMsg.includes('required') || errorMsg.includes('not found') || errorMsg.includes('quota') || errorMsg.includes('limit');
    const safeErrorMsg = isClientError ? errorMsg : 'An internal server error occurred while processing your request. Please try again later.';

    return new Response(
      JSON.stringify({ error: safeErrorMsg }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
