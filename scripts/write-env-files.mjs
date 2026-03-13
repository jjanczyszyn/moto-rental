#!/usr/bin/env node

/**
 * Write .env.local and .env.production with safe, publishable values only.
 * NEVER writes PAT, service role key, or DB password.
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const apiUrl = process.env.SUPABASE_API_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const managerEmail = process.env.MANAGER_EMAIL;
const githubPagesUrl = process.env.GITHUB_PAGES_URL;

if (!apiUrl || !anonKey || !managerEmail || !githubPagesUrl) {
  console.error('ERROR: Missing required env vars (SUPABASE_API_URL, SUPABASE_ANON_KEY, MANAGER_EMAIL, GITHUB_PAGES_URL)');
  process.exit(1);
}

// Derive base path from GitHub Pages URL
// e.g., https://user.github.io/moto-rental → /moto-rental/
const url = new URL(githubPagesUrl);
const basePath = url.pathname.endsWith('/') ? url.pathname : url.pathname + '/';

// .env.local (local dev)
const envLocal = [
  `VITE_SUPABASE_URL=${apiUrl}`,
  `VITE_SUPABASE_ANON_KEY=${anonKey}`,
  `VITE_MANAGER_EMAIL=${managerEmail}`,
  `VITE_BASE_PATH=/`,
  '',
].join('\n');

// .env.production (GitHub Pages)
const envProd = [
  `VITE_SUPABASE_URL=${apiUrl}`,
  `VITE_SUPABASE_ANON_KEY=${anonKey}`,
  `VITE_MANAGER_EMAIL=${managerEmail}`,
  `VITE_BASE_PATH=${basePath}`,
  '',
].join('\n');

writeFileSync(join(root, '.env.local'), envLocal, 'utf-8');
writeFileSync(join(root, '.env.production'), envProd, 'utf-8');

console.error('Wrote .env.local (BASE_PATH=/)');
console.error(`Wrote .env.production (BASE_PATH=${basePath})`);
