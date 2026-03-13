#!/usr/bin/env bash
set -euo pipefail

# Generate TypeScript types from the remote Supabase schema.

if [ -z "${SUPABASE_PROJECT_REF:-}" ]; then
  echo "ERROR: SUPABASE_PROJECT_REF is not set" >&2
  exit 1
fi

echo "Generating TypeScript types from schema..."
supabase gen types typescript --project-id "$SUPABASE_PROJECT_REF" > src/lib/database.types.ts

echo "Types written to src/lib/database.types.ts"
