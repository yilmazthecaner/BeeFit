/**
 * Supabase Edge Function — Search Context
 *
 * Generates an OpenAI text embedding for the user's query and searches
 * the `ai_context_entries` table using pgvector similarity match.
 *
 * POST /search-context
 * Body: { userId: string, query: string, topK?: number }
 */

// @ts-nocheck
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
    const { userId, query, topK = 5 } = await req.json();

    if (!userId || !query) {
      return new Response(
        JSON.stringify({ error: 'userId and query are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // 1. Get embedding from OpenAI
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query,
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      throw new Error(`OpenAI Embedding API error: ${embeddingResponse.status} - ${errorText}`);
    }

    const embeddingResult = await embeddingResponse.json();
    const queryEmbedding = embeddingResult.data[0].embedding;

    // 2. Perform vector search using RPC
    const { data: entries, error: matchError } = await supabaseClient
      .rpc('match_context_entries', {
        query_embedding: queryEmbedding,
        match_user_id: userId,
        match_threshold: 0.5, // Return moderately related entries
        match_count: topK,
      });

    if (matchError) {
      throw new Error(`Failed to search context: ${matchError.message}`);
    }

    return new Response(
      JSON.stringify({ entries: entries || [] }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[search-context] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
