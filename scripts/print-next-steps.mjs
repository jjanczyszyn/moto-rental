#!/usr/bin/env node

/**
 * Print exact manual steps remaining after automated bootstrap.
 */

const githubPagesUrl = process.env.GITHUB_PAGES_URL || 'https://<username>.github.io/<repo>';
const localUrl = 'http://localhost:5173';

console.log(`
==========================================
  NEXT STEPS — Manual Configuration
==========================================

1. OAUTH REDIRECT URLs (copy-paste these):

   Local:      ${localUrl}/auth-callback.html
   Production: ${githubPagesUrl}/auth-callback.html

2. GOOGLE CLOUD CONSOLE:

   - Go to https://console.cloud.google.com/apis/credentials
   - Select or create an OAuth 2.0 Client ID
   - Add Authorized redirect URIs:
     • ${localUrl}/auth-callback.html
     • ${githubPagesUrl}/auth-callback.html
   - Add Authorized JavaScript origins:
     • ${localUrl}
     • ${githubPagesUrl}
   - Copy the Client ID and Client Secret

3. SUPABASE AUTH CONFIGURATION:

   - Go to your Supabase project dashboard → Authentication → Providers
   - Enable Google provider
   - Enter the Google Client ID and Client Secret from step 2

4. GITHUB SECRETS (for CI/CD):

   - Go to your repo → Settings → Secrets and variables → Actions
   - Add: VITE_SUPABASE_URL (from .env.local)
   - Add: VITE_SUPABASE_ANON_KEY (from .env.local)

5. VERIFICATION CHECKLIST:

   □ npm run dev → visit ${localUrl}
   □ Public page loads and shows 3 motorcycles
   □ Submit a test booking on public page
   □ Visit ${localUrl}/admin.html
   □ Sign in with manager email via Google
   □ Verify bookings appear in admin view

==========================================
`);
