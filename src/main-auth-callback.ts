import { supabase } from './lib/supabase';
import { BASE_PATH } from './lib/config';

const TIMEOUT_MS = 5000;
const adminUrl = `${BASE_PATH}admin.html`;

const main = document.querySelector('main.container');

// Check for OAuth error params in URL
const params = new URLSearchParams(window.location.search);
const oauthError = params.get('error');
const oauthErrorDesc = params.get('error_description');

if (oauthError) {
  showError(oauthErrorDesc || 'Authentication failed. Please try again.');
} else {
  // Listen for successful auth (Supabase client auto-detects hash fragment tokens)
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN') {
      subscription.unsubscribe();
      window.location.href = adminUrl;
    }
  });

  // Timeout fallback
  setTimeout(() => {
    subscription.unsubscribe();
    showError('Authentication failed. Please try again.');
  }, TIMEOUT_MS);
}

function showError(message: string): void {
  if (!main) return;
  main.innerHTML = `
    <div class="auth-error">
      <p>${message}</p>
      <a href="${adminUrl}" class="btn btn-primary">Back to Admin</a>
    </div>
  `;
}
