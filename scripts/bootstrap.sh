#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Moto Rental — Bootstrap Orchestrator
# Single entry point: provisions Supabase backend from env vars.
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# ---------------------------------------------------------------------------
# 1. Validate env vars
# ---------------------------------------------------------------------------
echo "==> Step 1: Validating environment variables..."

missing=0
check_env() {
  if [ -z "${!1:-}" ]; then
    echo "  ERROR: Missing $1. Set it with: export $1=$2" >&2
    missing=1
  fi
}

check_env SUPABASE_ACCESS_TOKEN "your-supabase-pat"
check_env SUPABASE_DB_PASSWORD "your-db-password"
check_env MANAGER_EMAIL "manager@example.com"
check_env GITHUB_PAGES_URL "https://your-username.github.io/repo-name"

# Need either ORG_SLUG (fresh) or PROJECT_REF (existing)
if [ -z "${SUPABASE_PROJECT_REF:-}" ] && [ -z "${SUPABASE_ORG_SLUG:-}" ]; then
  echo "  ERROR: Missing SUPABASE_ORG_SLUG (for new project) or SUPABASE_PROJECT_REF (for existing project)." >&2
  echo "  Set one with: export SUPABASE_ORG_SLUG=your-org-slug" >&2
  missing=1
fi

if [ "$missing" -eq 1 ]; then
  echo "Bootstrap aborted — fix missing env vars above." >&2
  exit 1
fi
echo "  All required env vars present."

# ---------------------------------------------------------------------------
# 2. Provision Supabase project
# ---------------------------------------------------------------------------
echo "==> Step 2: Provisioning Supabase project..."
PROVISION_OUTPUT=$(node "$SCRIPT_DIR/provision-supabase.mjs")
echo "  Provisioning output: $PROVISION_OUTPUT"

# Parse JSON output
SUPABASE_PROJECT_REF=$(echo "$PROVISION_OUTPUT" | node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8')).projectRef)")
SUPABASE_API_URL=$(echo "$PROVISION_OUTPUT" | node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8')).apiUrl)")
SUPABASE_ANON_KEY=$(echo "$PROVISION_OUTPUT" | node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8')).anonKey)")

export SUPABASE_PROJECT_REF SUPABASE_API_URL SUPABASE_ANON_KEY
echo "  Project ref: $SUPABASE_PROJECT_REF"

# ---------------------------------------------------------------------------
# 3. Render migration from template
# ---------------------------------------------------------------------------
echo "==> Step 3: Rendering migration template..."
node "$SCRIPT_DIR/render-migration.mjs"

# ---------------------------------------------------------------------------
# 4. Link CLI and push migration
# ---------------------------------------------------------------------------
echo "==> Step 4: Linking Supabase CLI and pushing migration..."
bash "$SCRIPT_DIR/link-and-push.sh"

# ---------------------------------------------------------------------------
# 5. Generate TypeScript types
# ---------------------------------------------------------------------------
echo "==> Step 5: Generating TypeScript types from schema..."
bash "$SCRIPT_DIR/gen-types.sh"

# ---------------------------------------------------------------------------
# 6. Write env files
# ---------------------------------------------------------------------------
echo "==> Step 6: Writing .env.local and .env.production..."
node "$SCRIPT_DIR/write-env-files.mjs"

# ---------------------------------------------------------------------------
# 7. Print next steps
# ---------------------------------------------------------------------------
echo "==> Step 7: Next steps..."
node "$SCRIPT_DIR/print-next-steps.mjs"

echo ""
echo "=========================================="
echo "  Bootstrap complete!"
echo "  Ready to run: npm run dev"
echo "=========================================="
