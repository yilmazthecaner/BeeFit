/**
 * Supabase Client — Singleton instance
 *
 * Initializes the Supabase JS client with the project URL and anon key.
 * In production, use secure storage for auth tokens.
 */

import { createClient } from '@supabase/supabase-js';
import Config from '../../constants/config';

export const supabase = createClient(
  Config.SUPABASE_URL,
  Config.SUPABASE_ANON_KEY,
  {
    auth: {
      // In a real app, use expo-secure-store for token persistence
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);

export default supabase;
