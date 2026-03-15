/**
 * Supabase Edge Function — Store Context
 *
 * Generates an OpenAI text embedding for the given content and stores it
 * in the `ai_context_entries` table for future RAG retrieval.
 *
 * POST /store-context
 * Body: { userId: string, entryType: string, content: string, sourceTable?: string, sourceId?: string }
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
    const { userId, entryType, content, sourceTable, sourceId } = await req.json();

    if (!userId || !content || !entryType) {
      return new Response(
        JSON.stringify({ error: 'userId, entryType, and content are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Initialize Supabase Client (bypassing RLS with service role for edge function inserts)
    // RLS could be used, but since it's an internal function called by clients/other functions we use service role or Anon if auth header provided
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
        input: content,
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      throw new Error(`OpenAI Embedding API error: ${embeddingResponse.status} - ${errorText}`);
    }

    const embeddingResult = await embeddingResponse.json();
    const embedding = embeddingResult.data[0].embedding;

    // 2. Insert into ai_context_entries
    const { error: insertError } = await supabaseClient
      .from('ai_context_entries')
      .insert({
        user_id: userId,
        entry_type: entryType,
        content: content,
        embedding: embedding,
        source_table: sourceTable,
        source_id: sourceId,
      });

    if (insertError) {
      throw new Error(`Failed to insert context into DB: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[store-context] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
