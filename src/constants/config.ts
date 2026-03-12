/**
 * App Configuration — Environment & API Settings
 *
 * In a production app, these would come from environment variables.
 * Using Constants.expoConfig.extra for Expo-managed env vars.
 */

import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const Config = {
  // ── Supabase ──
  SUPABASE_URL: extra.supabaseUrl ?? 'https://vjekuzutkvaicuhtrzlt.supabase.co',
  SUPABASE_ANON_KEY: extra.supabaseAnonKey ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqZWt1enV0a3ZhaWN1aHRyemx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMjExNjQsImV4cCI6MjA4ODg5NzE2NH0._3pJyfZX_aqR4u3ZiDkwSFAODTq2xqDzUI0dMEWm2LU',

  // ── OpenAI ──
  OPENAI_API_KEY: extra.openaiApiKey ?? '',

  // ── App Settings ──
  APP_NAME: 'BeeFit',
  APP_VERSION: '1.0.0',

  // ── AI Coach Settings ──
  AI_MODEL: 'gpt-4o' as const,
  AI_VISION_MODEL: 'gpt-4o' as const,
  EMBEDDING_MODEL: 'text-embedding-3-small' as const,
  EMBEDDING_DIMENSIONS: 1536,
  MAX_CONTEXT_ENTRIES: 20,        // max context entries per coach query
  CONVERSATION_SUMMARY_THRESHOLD: 10,  // summarize after N messages

  // ── HealthKit ──
  HEALTHKIT_SYNC_INTERVAL_MS: 15 * 60 * 1000,  // 15 minutes
} as const;

export default Config;
