import { createClient } from '@supabase/supabase-js';

function normalizeSupabaseUrl(raw: string): string {
  if (!raw) return '';
  return raw.trim().replace(/\/+$/, '').replace(/\/rest\/v1\/?$/, '');
}

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabaseUrl = normalizeSupabaseUrl(rawUrl);
export const supabaseAnonKey = rawKey.trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20
);

if (!isSupabaseConfigured) {
  console.info(
    'ℹ️ Supabase credentials not detected in .env. Running in browser-persistent localStorage mode.'
  );
} else {
  console.info('⚡ Supabase PostgreSQL connected successfully to:', supabaseUrl);
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as any);

