#!/usr/bin/env bash
set -euo pipefail

# Link local Supabase CLI to remote project and push migrations.

if [ -z "${SUPABASE_PROJECT_REF:-}" ]; then
  echo "ERROR: SUPABASE_PROJECT_REF is not set" >&2
  exit 1
fi

if [ -z "${SUPABASE_DB_PASSWORD:-}" ]; then
  echo "ERROR: SUPABASE_DB_PASSWORD is not set" >&2
  exit 1
fi

echo "Linking to project: $SUPABASE_PROJECT_REF"
echo "$SUPABASE_DB_PASSWORD" | supabase link --project-ref "$SUPABASE_PROJECT_REF"

echo "Pushing migrations..."
supabase db push

echo "Migrations applied successfully."
