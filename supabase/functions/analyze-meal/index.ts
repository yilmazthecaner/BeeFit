/**
 * Supabase Edge Function — Analyze Meal Photo
 *
 * Receives a meal photo URL, sends it to GPT-4o Vision for analysis,
 * and returns the nutritional breakdown.
 *
 * POST /analyze-meal
 * Body: { photoUrl: string, prompt: string, model: string }
 * Response: { analysis: VisionAnalysisResult }
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

    // Limit check for Free users (1 meal analysis/day)
    const MAX_FREE_ANALYSIS = 1;
    if (status === 'free' && usage_count >= MAX_FREE_ANALYSIS) {
      return new Response(
        JSON.stringify({ 
          error: 'Daily meal analysis limit reached', 
          code: 'LIMIT_REACHED',
          message: 'Günlük yemek analizi limitine ulaştın. Sınırsız analiz için Premium\'a geç!' 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { photoUrl, prompt, model } = await req.json();

    if (!photoUrl) {
      return new Response(
        JSON.stringify({ error: 'photoUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    // DeepSeek API doesn't fully support structured JSON vision yet. 
    // Load balance between OpenAI and Gemini for images.
    const availableProviders = [];
    if (openaiApiKey) availableProviders.push('openai');
    if (geminiApiKey) availableProviders.push('gemini');

    if (availableProviders.length === 0) {
      throw new Error('No AI provider API keys configured for Vision (OpenAI or Gemini required).');
    }

    const shuffledProviders = availableProviders.sort(() => Math.random() - 0.5);
    
    let lastError = null;
    let analysis = null;
    let successfulProvider = null;

    for (const provider of shuffledProviders) {
      try {
        console.log(`[analyze-meal] Attempting vision analysis with provider: ${provider}`);

        if (provider === 'openai') {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: model ?? 'gpt-4o',
              messages: [
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: prompt },
                    { type: 'image_url', image_url: { url: photoUrl, detail: 'high' } },
                  ],
                },
              ],
              max_tokens: 1000,
              temperature: 0.3,
              response_format: { type: 'json_object' },
            }),
          });

          if (!response.ok) throw new Error(`OpenAI Vision error: ${response.status} ${await response.text()}`);
          
          const result = await response.json();
          const content = result.choices?.[0]?.message?.content;
          
          if (content) {
             analysis = JSON.parse(content);
          }
        } 
        
        else if (provider === 'gemini') {
           // Gemini requires the image to be base64 or sent as part of the inlineData if it's a remote URL.
           // However, for remote URLs, the easiest way is to download it quickly and convert it to base64 for Gemini.
           const imageRes = await fetch(photoUrl);
           const imageBuffer = await imageRes.arrayBuffer();
           const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
           const mimeType = imageRes.headers.get('content-type') || 'image/jpeg';

           // IMPORTANT: Instruct Gemini explicitly to return valid JSON
           const promptWithFormatting = `${prompt}\n\nPlease respond ONLY with a raw JSON object and absolutely no markdown formatting or backticks.`;

           const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: promptWithFormatting },
                  {
                    inlineData: {
                      mimeType: mimeType,
                      data: base64Image
                    }
                  }
                ]
              }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 1000,
                responseMimeType: "application/json"
              }
            }),
          });

          if (!response.ok) throw new Error(`Gemini Vision error: ${response.status} ${await response.text()}`);
          
          const result = await response.json();
          const content = result.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (content) {
             // Gemini might return markdown fenced JSON depending on prompting/api version. Attempt to clean it.
             const cleanedStr = content.replace(/```json\n|```/g, '').trim();
             analysis = JSON.parse(cleanedStr);
          }
        }

        if (analysis) {
          successfulProvider = provider;
          break; // Success! Break out of fallback loop.
        }

      } catch (err: any) {
         console.warn(`[analyze-meal] Provider ${provider} failed:`, err.message);
         lastError = err;
      }
    }

    if (!analysis) {
      throw new Error(`All available Vision AI providers failed. Last error: ${lastError?.message}`);
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
      JSON.stringify({ analysis, provider: successfulProvider }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('[analyze-meal] Critical Error:', error.message);
    const errorMsg = error.message || 'Unknown error';
    const isClientError = errorMsg.includes('required') || errorMsg.includes('not found') || errorMsg.includes('quota') || errorMsg.includes('limit') || errorMsg.includes('analysis limit reached');
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
