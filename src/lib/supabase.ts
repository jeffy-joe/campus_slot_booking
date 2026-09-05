import { isNeonConfigured } from './neon';

export const isSupabaseConfigured = (): boolean => {
  return isNeonConfigured();
};

export const supabase = null;
