const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  throw new Error('Missing required env var: VITE_SUPABASE_URL');
}
if (!SUPABASE_ANON_KEY) {
  throw new Error('Missing required env var: VITE_SUPABASE_ANON_KEY');
}

export { SUPABASE_URL, SUPABASE_ANON_KEY };

export const BASE_PATH = import.meta.env.VITE_BASE_PATH || '/';

export const AUTH_CALLBACK_URL = `${window.location.origin}${BASE_PATH}auth-callback.html`;

export const MANAGER_EMAIL = import.meta.env.VITE_MANAGER_EMAIL || '';
