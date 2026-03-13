#!/usr/bin/env node

/**
 * Render the migration template by replacing {MANAGER_EMAIL} with the actual email.
 * Reads from supabase/migrations/0001_init.sql.template
 * Writes to supabase/migrations/0001_init.sql
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const email = process.env.MANAGER_EMAIL;
if (!email) {
  console.error('ERROR: MANAGER_EMAIL env var is not set. Set MANAGER_EMAIL=your@email.com');
  process.exit(1);
}

if (!email.includes('@')) {
  console.error('ERROR: MANAGER_EMAIL does not appear to be a valid email (missing @)');
  process.exit(1);
}

// Escape single quotes for SQL injection safety
const safeEmail = email.replace(/'/g, "''");

const templatePath = join(root, 'supabase', 'migrations', '0001_init.sql.template');
const outputPath = join(root, 'supabase', 'migrations', '0001_init.sql');

const template = readFileSync(templatePath, 'utf-8');
const rendered = template.replaceAll('{MANAGER_EMAIL}', safeEmail);

// Verify no leftover placeholders
if (rendered.includes('{MANAGER_EMAIL}')) {
  console.error('ERROR: Leftover {MANAGER_EMAIL} placeholders after rendering');
  process.exit(1);
}

writeFileSync(outputPath, rendered, 'utf-8');
console.error(`Migration rendered: ${outputPath}`);
console.error(`Manager email: ${email}`);
