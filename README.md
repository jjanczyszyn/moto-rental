# Moto Rental

Motorcycle rental management app — vanilla TypeScript, Vite, Supabase, GitHub Pages. Built for a 3-bike rental business in El Salvador with anonymous public booking, contract signing, delivery tracking, and a single Google-authenticated manager dashboard.

**Live site:** https://jjanczyszyn.github.io/moto-rental/

## Features

- **Public booking wizard** — 6-step flow: select motorcycle → pick dates → see pricing → enter details → sign contract → confirm
- **Live pricing** — 4-tier pricing (daily $20, weekly 10% off, biweekly 18% off, monthly $400 cap) with $100 security deposit
- **Contract signing** — digital contract with typed name and canvas signature, printable PDF
- **Customer reservation lookup** — access booking details with reservation code + secret
- **Manager dashboard** — Google OAuth, booking management (approve/reject/activate/complete), manager notes
- **Delivery board** — date-filtered view (today/tomorrow/7 days/custom), status tracking, WhatsApp + map quick actions
- **Metrics** — earnings, active bookings, occupancy %, pending count, deliveries today
- **3 motorcycles** — Yamaha XTZ 125 (White, Manual), Blue Genesis Klik (Automatic), Pink Genesis Klik (Automatic)

## Prerequisites

- Node.js 20+ and npm
- A [Supabase](https://supabase.com) account (free tier works)
- A [Google Cloud](https://console.cloud.google.com) project with OAuth 2.0 credentials
- A GitHub account (for GitHub Pages deployment)

## First-Time Setup

The `scripts/bootstrap.sh` script automates Supabase provisioning, database setup, and env file generation.

### Step 1: Configure provisioning environment

```bash
cp .env.setup.example .env.setup
```

Edit `.env.setup` with your values:
- `SUPABASE_ACCESS_TOKEN` — from [Supabase Dashboard → Settings → Access Tokens](https://supabase.com/dashboard/account/tokens)
- `SUPABASE_ORG_SLUG` — from your Supabase organization URL
- `MANAGER_EMAIL` — the Google email that will have admin access
- `GITHUB_PAGES_URL` — your GitHub Pages URL (e.g., `https://username.github.io/moto-rental`)
- `LOCAL_DEV_URL` — typically `http://localhost:5173`

### Step 2: Run bootstrap

```bash
npm run bootstrap
# or directly:
bash scripts/bootstrap.sh
```

This will:
1. Validate required env vars
2. Create a new Supabase project (or reuse existing)
3. Link the Supabase CLI to the project
4. Render and apply the database migration (schema, RLS, seed data)
5. Generate TypeScript types from the database
6. Write `.env.local` and `.env.production` with `VITE_*` variables
7. Print next steps (Google OAuth configuration URLs)

### Step 3: Configure Google OAuth

Follow the printed URLs to configure Google as an auth provider in your Supabase project. See [Google OAuth Setup](#google-oauth-setup) below.

### Step 4: Start developing

```bash
npm install
npm run dev
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select an existing one)
3. Navigate to **APIs & Services → OAuth consent screen**
   - Choose "External" user type
   - Fill in app name, user support email, developer contact email
   - No scopes needed beyond default (email, profile, openid)
   - Add your email as a test user (while in "Testing" status)
4. Navigate to **APIs & Services → Credentials**
   - Click **Create Credentials → OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Name: anything (e.g., "Moto Rental")
   - Authorized JavaScript origins:
     - `http://localhost:5173` (local dev)
     - `https://your-username.github.io` (GitHub Pages)
   - Authorized redirect URIs:
     - `http://localhost:5173/auth-callback.html`
     - `https://your-username.github.io/moto-rental/auth-callback.html`
5. Copy the **Client ID** and **Client Secret**
6. In your Supabase project dashboard:
   - Go to **Authentication → Providers → Google**
   - Enable Google provider
   - Paste the Client ID and Client Secret
   - Save

## Local Development

```bash
npm run dev          # Start Vite dev server at http://localhost:5173
npm run typecheck    # Type-check without emitting
npm run build        # Production build to dist/
npm run preview      # Preview production build locally
```

Pages:
- `http://localhost:5173/` — Public landing page (motorcycle cards, 6-step booking wizard)
- `http://localhost:5173/admin.html` — Manager dashboard (metrics, booking management, delivery tracking)
- `http://localhost:5173/customer.html` — Customer reservation lookup (code + secret)
- `http://localhost:5173/auth-callback.html` — OAuth callback (not visited directly)

## Available Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `vite` | Start local dev server |
| `build` | `vite build` | Production build to `dist/` |
| `preview` | `vite preview` | Preview production build locally |
| `typecheck` | `tsc --noEmit` | Type-check without emitting |
| `lint` | `eslint src` | Lint source files |
| `test` | `vitest run` | Run unit tests |

## Project Structure

```
src/
  lib/
    auth.ts               — auth helpers (signIn, signOut, getSession)
    business-config.ts    — business constants (pricing, payment methods, motorcycles, contact info)
    config.ts             — environment variable access, BASE_PATH, AUTH_CALLBACK_URL, MANAGER_EMAIL
    database.types.ts     — Supabase database types (generated post-bootstrap)
    pricing.ts            — rental pricing calculator (daily, weekly, biweekly, monthly tiers)
    rpc-params.ts         — Supabase RPC parameter sanitization
    supabase.ts           — typed Supabase client singleton
    types.ts              — data model types (Motorcycle, Booking, etc.)
    utils.ts              — date utilities, escapeHtml, formatDate, parseDate, calculateNights
    business-config.test.ts — config integrity tests
    pricing.test.ts       — pricing calculation tests
    utils.test.ts         — utility function tests
  styles.css              — shared styles (reset, typography, cards, forms, dashboard, badges)
  main-public.ts          — public landing: hero, motorcycle cards, 6-step booking wizard, contract signing
  main-admin.ts           — admin dashboard: metrics bar, booking management, delivery/payment tracking
  main-customer.ts        — customer reservation lookup: code + secret access, booking details view
  main-auth-callback.ts   — OAuth callback: session resolution + redirect
  vite-env.d.ts           — Vite client type declarations
index.html                — public landing page
admin.html                — manager dashboard page
customer.html             — customer reservation lookup page
auth-callback.html        — OAuth return handler
vite.config.ts            — Vite build configuration (multi-page, 4 entry points)
tsconfig.json             — TypeScript configuration
public/
  images/                 — motorcycle product photos (WebP/JPG)
scripts/
  bootstrap.sh            — full provisioning orchestrator
  provision-supabase.mjs  — create or reuse Supabase project
  render-migration.mjs    — render migration template with MANAGER_EMAIL
  link-and-push.sh        — link CLI + push migrations
  gen-types.sh            — generate TypeScript types from schema
  write-env-files.mjs     — write .env.local and .env.production
  print-next-steps.mjs    — print OAuth configuration URLs
supabase/
  config.toml             — Supabase local config (auth providers)
  migrations/             — SQL migrations (0001–0013)
docs/
  qa/                     — QA reports and test matrices
  briefs/                 — project briefs and specs
```

## Environment Variables

### Build-time variables (`VITE_*`)

See `.env.example` for all required frontend variables. These are embedded at build time by Vite:

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous/public key (safe to expose)
- `VITE_BASE_PATH` — Base path for GitHub Pages deployment (`/` for local dev)
- `VITE_MANAGER_EMAIL` — Manager email for admin login authorization

### Provisioning variables

See `.env.setup.example` for variables used during Supabase provisioning. These are never used in the frontend build:

- `SUPABASE_ACCESS_TOKEN` — Management API token
- `SUPABASE_ORG_SLUG` — Organization slug
- `SUPABASE_DB_PASSWORD` — Database password (auto-generated if not set)
- `MANAGER_EMAIL` — Manager Google email (used in migration RLS policies)
- `GITHUB_PAGES_URL` — Production URL for env file generation
- `LOCAL_DEV_URL` — Local dev URL (default: `http://localhost:5173`)

## Deployment

### GitHub Pages (default)

Deployed automatically via GitHub Actions on push to `main`.

- Workflow: `.github/workflows/deploy-pages.yml`
- `VITE_BASE_PATH` is set automatically from the repository name

Required GitHub repository secrets:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_MANAGER_EMAIL`

To set secrets: Repository → Settings → Secrets and variables → Actions → New repository secret.

### Manual deploy

```bash
npm run build
# Upload dist/ to any static hosting
```

Note: Set `VITE_BASE_PATH` to match your hosting path (e.g., `/moto-rental/` for GitHub Pages).

## Manager Email Rotation

To change the manager email (the Google account authorized for the admin dashboard):

### Step 1: Update `.env.setup`

```bash
# Edit .env.setup
MANAGER_EMAIL=new-manager@gmail.com
```

### Step 2: Re-render migration template

The RLS policies hardcode the manager email. Re-render with the new value:

```bash
node scripts/render-migration.mjs
```

### Step 3: Push updated migration to Supabase

Apply the updated RLS policies to the live database:

```bash
bash scripts/link-and-push.sh
```

### Step 4: Update frontend environment

Update `VITE_MANAGER_EMAIL` in both `.env.local` and `.env.production`:

```bash
VITE_MANAGER_EMAIL=new-manager@gmail.com
```

If using GitHub Actions, also update the `VITE_MANAGER_EMAIL` repository secret:
Repository → Settings → Secrets and variables → Actions → Update `VITE_MANAGER_EMAIL`.

### Step 5: Rebuild and redeploy

```bash
npm run build
```

- **GitHub Pages:** push to `main` to trigger the deploy workflow.
- **Manual hosting:** upload `dist/` to your hosting provider.

### Step 6: Verify access

- [ ] New manager can sign in at `admin.html` and see the dashboard
- [ ] Old manager is signed out and shown "Access Denied" message
- [ ] Public booking form still works for anonymous users

## Known Limitations

- Single manager only — one email controls admin access (no multi-user roles)
- No real-time updates — dashboard requires manual refresh to see new bookings
- No image uploads — motorcycle images are URLs stored in the database
- No email notifications — manager must check dashboard for new bookings
- Bootstrap creates a fresh Supabase project — no migration path for existing data

## Roadmap

- [x] **M1**: Repository Foundation + Deployment Skeleton
- [x] **M2**: Supabase Provisioning + Database Security Spine
- [x] **M3**: Public Experience
- [x] **M4**: Admin Experience
- [x] **M5**: Documentation + Hardening + Final QA
- [x] **M6**: Schema Upgrade + Business Config + Image Assets
- [x] **M7**: Landing Page + Motorcycle Cards Upgrade
- [x] **M8**: Guided Booking Flow + Pricing + Availability
- [x] **M9**: Contract Signing + Delivery Details
- [x] **M10**: Customer Reservation Access
- [x] **M11**: Admin Dashboard Expansion + Delivery Board
- [x] **M12**: Review Flow + README + Final QA
- [x] **QA1**: Post-Milestone QA — Test, Stabilize, Improve
