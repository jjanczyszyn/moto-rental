Chief > Operator · Project: MOTO-RENTAL-GHP-SUPABASE · Focus: Build Brief + Work Order Plan

Step 1/3 · Next: Hand this artifact to Foreman, then have Hawkeye turn Milestones M1-M5 into implementation-obvious technical specs.

## Ask Restated
- Build a production-minded but intentionally small moto rental management app for a 3-bike business.
- Frontend must live on GitHub Pages. Backend must be Supabase only. No custom server. Security must be enforced by Supabase, not hidden routes.

## Operator Note
This is a project-lane artifact, not a Concourse platform change. The crew should treat this as a product build under a new project handle, not as work on Concourse itself.

# BUILD BRIEF: Moto Rental App on GitHub Pages + Supabase
Project: MOTO-RENTAL-GHP-SUPABASE
Author: Chief
Date: 2026-03-12
Status: Draft

## What We're Building
A very small rental management app for a business with exactly 3 motorcycles. Public users can view motorcycles and submit booking requests without creating accounts. A single manager signs in with Google through Supabase Auth to review and manage bookings. The frontend is a static multi-page Vite app deployed to GitHub Pages. Supabase owns database, auth, row-level security, and the public booking RPC.

## Why
The business is too small for a heavyweight system. The goal is a boring, maintainable, low-ops app that handles real booking workflow without introducing a backend server, fake security, or auth complexity. The app should remove manual back-and-forth for intake while keeping all privileged access restricted to one manager.

## Constraints
- Frontend hosting: GitHub Pages only
- Backend: Supabase only
- No custom backend server
- No Next.js, Nuxt, Remix, or other SSR frameworks
- No customer accounts
- Manager-only admin with Google social login through Supabase
- Security must be enforced in Supabase RLS and RPCs
- Browser may use only publishable Supabase key
- Setup automation must use Supabase Management API and Supabase CLI
- Automation must be honest about manual prerequisites
- GitHub repository already exists
- Google OAuth client already exists
- Supabase PAT and organization slug or ID must be provided by env vars

## Product Scope
### In
- Public landing page with 3 motorcycle cards
- Public booking request form with date validation and availability awareness
- Security-definer RPC for anonymous booking creation
- Admin page with Google sign-in
- Manager-only dashboard for booking review and lifecycle actions
- Auth callback page for OAuth return handling
- Supabase schema, migrations, seed data, RLS, policies, and generated TS types
- Bootstrap and provisioning scripts
- GitHub Actions workflow for Pages deploy
- Useful README with exact setup and remaining manual steps

### Out
- Customer accounts or self-service reservation editing
- Payments, invoicing, refunds, or Stripe integration
- SMS, WhatsApp sending, or email notifications
- Calendar sync
- Multi-manager roles
- Fleet expansion logic beyond simple table rows
- CMS, analytics platform, or admin audit log beyond standard timestamps
- Serverless functions unless required by Supabase auth or setup workflow. Default assumption: not needed.

## Success Criteria
- Public site runs locally and builds for GitHub Pages
- Anonymous user can submit booking request
- Anonymous user cannot list bookings or mutate bookings directly
- Manager can sign in with Google and access admin only if JWT email matches allowed email
- Wrong Google account is signed out and blocked both in UI and DB policies
- Manager can approve, reject, activate, complete, cancel, and edit notes
- Bootstrap script can provision or connect to Supabase without dashboard clicking for Supabase project setup
- Frontend env files contain no secrets
- Repo contains valid GitHub Pages workflow and honest README

## Quality Bar
- No dead code
- No mock auth
- No hidden frontend-only security theater
- No hardcoded secrets
- No placeholders in production paths
- All acceptance criteria demonstrably testable
- README good enough that a human can recreate setup from scratch
- Build passes, typecheck passes, lint passes
- RLS and public RPC verified with real negative-path tests

## Non-Goals Clarification
This is not a marketplace, not a fleet platform, and not a polished consumer product. Resist feature creep. The only job is to accept booking requests publicly and let one manager manage them safely.

## Assumptions
- One manager email only for v1
- Repo path deployment under `https://<user>.github.io/<repo>/`
- Booking overlap rules only block statuses `approved` and `active`
- `pending`, `rejected`, `cancelled`, and `completed` do not block availability
- Manual Google Cloud console setup remains necessary for OAuth client creation and redirect origin configuration

## Risks
- Risk: GitHub Pages base-path mistakes break auth callback routing. Mitigation: make `base` explicit and test local plus repo-path production builds.
- Risk: Supabase Management API coverage may differ from assumptions. Mitigation: treat provisioning script as best-effort, pin exact endpoints used, and fail loudly if unsupported.
- Risk: OAuth redirect URL mismatch causes silent login failure. Mitigation: centralize URL generation and print exact values for Google Cloud setup.
- Risk: RLS appears correct while public RPC bypasses business rules. Mitigation: test direct table access denial and overlap rejection explicitly.
- Risk: Over-automation creates brittle setup. Mitigation: automate only deterministic steps and document manual prerequisites plainly.

## Open Questions
- Confirm whether `SUPABASE_ORGANIZATION_SLUG` or org ID is preferred by the target Management API calls. Script should support slug first and fail with precise guidance if the API needs ID.
- Confirm whether `publishable` key naming in current Supabase API response is stable. Script should detect the anon/publishable key safely.
- Confirm whether Tailwind meaningfully improves maintainability here. Default to minimal CSS unless Hawkeye can justify Tailwind with no complexity tax.

---

# PRODUCT PRD: Moto Rental App
Project: MOTO-RENTAL-GHP-SUPABASE
Author: Chief
Date: 2026-03-12
Status: Draft

## 1. Problem
The business needs a simple way to accept booking requests online and manage them without exposing sensitive data or standing up a custom backend. Existing manual coordination is error-prone and does not provide a clean availability-aware intake flow.

## 2. Target User / JTBD
### Public renter
When I browse available motorcycles, I want to request a booking for a date range without creating an account, so I can quickly express interest and get confirmed by the business.

### Manager
When booking requests arrive, I want to securely review and update them in one place, so I can run the rental operation without spreadsheets or insecure hacks.

## 3. Goals
- Reduce booking intake friction to one public form
- Keep all privileged access limited to one manager account
- Make setup reproducible by script for future reuse
- Keep ongoing ops close to zero

## 4. Non-Goals
- Automated customer communications
- Complex pricing rules
- Promo codes, deposits, payment collection
- Customer portal
- Native mobile app

## 5. UX / User Flow
### Public flow
1. User lands on `index.html`
2. User sees hero plus 3 motorcycle cards
3. User opens or scrolls to booking request form
4. User chooses motorcycle and dates
5. Client validates basic date sanity before submit
6. App calls `public.create_booking_request(...)`
7. RPC validates motorcycle, dates, and overlap rules
8. App shows success state with reservation code

### Manager flow
1. Manager opens `admin.html`
2. If signed out, sees Google sign-in button
3. OAuth returns through `auth-callback.html`
4. App resolves session and redirects to `admin.html`
5. If signed-in email matches manager email, dashboard loads
6. Manager reviews grouped bookings and updates status or notes
7. Wrong-account user is signed out and shown unauthorized state

## 6. Functional Requirements
### 6.1 Frontend architecture
- Vite multi-page app, not SPA routing
- Pages:
  - `index.html`
  - `admin.html`
  - `auth-callback.html`
- Shared TypeScript modules for config, Supabase client, utils, and types

### 6.2 Public page
- Show hero/business summary
- Show exactly 3 motorcycle cards from DB
- Show booking request form with fields:
  - motorcycle
  - full name
  - email
  - WhatsApp
  - start date
  - end date
  - notes
- Disable invalid date ranges in UI
- Submit through RPC only
- Show success state with reservation code

### 6.3 Admin page
- Signed-out state with Google sign-in CTA
- Signed-in authorized dashboard with sections:
  - Pending
  - Approved / upcoming
  - Active
  - Past / done
  - Cancelled / rejected
- Admin actions:
  - approve
  - reject
  - mark active
  - mark completed
  - cancel
  - edit notes
- Bookings also grouped by start date within status buckets or sortable by start date

### 6.4 Auth callback page
- Resolve returned session from Supabase Auth
- Handle success and failure cleanly
- Redirect to admin page after session persistence

### 6.5 Setup automation
- `./scripts/bootstrap.sh` performs environment checks, provisioning, migration rendering, linking, DB push, type generation, safe env writing, and next-step printing
- Script fails fast on missing required env vars
- Automation uses Supabase Management API plus Supabase CLI only
- No dashboard clicking required for Supabase project creation/configuration
- Google Cloud setup remains documented manual prerequisite

### 6.6 Repository deliverables
The repo must contain all files enumerated in the request. Missing files mean incomplete work.

## 7. Non-Functional Requirements
- Boring and maintainable
- TypeScript strict enough to catch shape drift
- Works under GitHub Pages repo path
- No secret material in built assets
- Reasonable UX on mobile and desktop
- Clean error states for auth and booking submission

## 8. Security & Privacy
- RLS on all tables
- Public can read only active motorcycles
- Public cannot read bookings table directly
- Public cannot insert into bookings table directly
- Public booking creation goes only through a security-definer RPC with validation
- Manager-only access enforced by SQL policy using JWT email match
- Wrong signed-in user gets denied at both UI and DB layers
- Publishable key only in frontend code

## 9. Data Model / Contracts
### `public.motorcycles`
- `id uuid primary key default gen_random_uuid()`
- `slug text unique not null`
- `name text not null`
- `brand text not null`
- `model text not null`
- `year integer`
- `daily_rate numeric(10,2) not null`
- `description text`
- `image_url text`
- `is_active boolean not null default true`
- `created_at timestamptz not null default now()`

### `public.bookings`
- `id uuid primary key default gen_random_uuid()`
- `reservation_code text unique not null`
- `motorcycle_id uuid not null references public.motorcycles(id) on delete restrict`
- `status text not null check (status in ('pending','approved','active','completed','cancelled','rejected')) default 'pending'`
- `customer_name text not null`
- `customer_email text`
- `customer_whatsapp text`
- `start_date date not null`
- `end_date date not null`
- `pickup_notes text`
- `dropoff_notes text`
- `manager_notes text`
- `total_quote numeric(10,2)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### RPC `public.create_booking_request(...)`
Must:
- validate `start_date <= end_date`
- validate motorcycle exists and is active
- reject overlaps with statuses `approved` or `active`
- generate short reservation code
- insert pending booking
- return reservation code and booking id

## 10. Edge Cases & Abuse Cases
- start date after end date
- inactive motorcycle selected
- overlapping booking request against approved or active booking
- duplicate rapid submits from same browser
- wrong Google account signs in successfully at provider level but must fail app authorization
- GitHub Pages base path causes broken redirect target
- project already exists and should be reused instead of recreated
- missing env var during bootstrap must halt with precise remediation

## 11. Acceptance Criteria
- [ ] `npm run dev` serves all three pages locally
- [ ] `npm run build` outputs static assets that work under repo base path
- [ ] public can load motorcycles without auth
- [ ] public booking request returns reservation code on valid submit
- [ ] public direct select on bookings fails
- [ ] public direct insert/update/delete on bookings fails
- [ ] manager can sign in with Google via Supabase
- [ ] wrong signed-in email cannot use admin page and cannot read bookings via Supabase
- [ ] manager can update booking statuses and notes
- [ ] exactly 3 motorcycles seeded
- [ ] bootstrap can provision or attach to Supabase project and complete the setup flow
- [ ] `.env.local` and `.env.production` contain only safe values
- [ ] README clearly documents manual Google OAuth steps

## 12. Instrumentation & Verification
Minimum required verification, not full analytics:
- Console error-free happy path in local dev
- Manual QA script in README
- Negative-path security verification using direct Supabase calls or SQL test notes
- Build and deploy validation through GitHub Actions

## 13. Rollout / Migration
- Initial rollout is new project, not migration from legacy app
- Seed 3 motorcycles in non-production-friendly placeholder form unless operator supplies real content
- After initial deploy, manager email rotation must be documented as migration regeneration plus DB push

---

# ROADMAP
Project: MOTO-RENTAL-GHP-SUPABASE

## Milestone M1: Repository Foundation + Deployment Skeleton
Goal: Create the static app shell, multi-page Vite config, build scripts, CI workflow, and environment contract.

### Deliverables
- `package.json`
- `vite.config.ts`
- `tsconfig.json`
- `index.html`
- `admin.html`
- `auth-callback.html`
- `src/styles.css`
- `src/lib/config.ts`
- `src/lib/types.ts`
- `src/lib/utils.ts`
- `.github/workflows/deploy-pages.yml`
- `.gitignore`
- `.env.example`
- `.env.setup.example`
- README skeleton

### Exit Criteria
- Repo installs cleanly
- Multi-page build works locally
- GitHub Pages base path is configured correctly
- CI workflow validates build artifact generation

## Milestone M2: Supabase Provisioning + Database Security Spine
Goal: Provision Supabase project, push schema, enable auth config, seed data, and establish RLS.

### Deliverables
- `supabase/config.toml`
- `supabase/migrations/0001_init.sql.template`
- `supabase/seed.sql`
- `scripts/bootstrap.sh`
- `scripts/provision-supabase.mjs`
- `scripts/render-migration.mjs`
- `scripts/link-and-push.sh`
- `scripts/gen-types.sh`
- `scripts/write-env-files.mjs`
- `scripts/print-next-steps.mjs`
- `src/lib/database.types.ts`

### Exit Criteria
- Fresh project can be provisioned from env vars
- Existing project can be reused safely
- Auth config patched successfully
- RLS and RPC verified locally
- Safe frontend env files generated with no secrets

## Milestone M3: Public Experience
Goal: Ship the public landing and booking request flow.

### Deliverables
- `src/main-public.tsx`
- public-facing components
- Supabase client integration for listing active motorcycles and submitting booking requests
- success and error states

### Exit Criteria
- Public can browse motorcycles
- Public can submit valid request
- Invalid date or overlap gets rejected cleanly

## Milestone M4: Admin Experience
Goal: Ship manager auth, callback handling, and booking operations dashboard.

### Deliverables
- `src/main-admin.tsx`
- `src/main-auth-callback.tsx`
- admin components and session logic
- grouped status views and update actions

### Exit Criteria
- Authorized manager can sign in and manage bookings
- Unauthorized signed-in user cannot operate the dashboard
- Auth callback works on localhost and GitHub Pages path deployment

## Milestone M5: Documentation + Hardening + Final QA
Goal: Make the repo maintainable after the build team leaves.

### Deliverables
- Complete `README.md`
- exact setup instructions
- manual Google OAuth steps
- local dev commands
- deploy notes
- known limitations
- manager email rotation procedure
- manual QA script

### Exit Criteria
- Human can set up from README without tribal knowledge
- All acceptance criteria evidenced
- No unresolved placeholders in live path

---

# WORK_ORDER: Build Moto Rental App v1
Project: MOTO-RENTAL-GHP-SUPABASE
Milestone: M1-M5
Owner: Foreman
Reviewers: Hawkeye (gate), Chief (spot-check)
Status: Draft

## Objective
Ship a minimal, secure, production-minded moto rental app that runs entirely on GitHub Pages plus Supabase, with anonymous public booking requests and a single Google-authenticated manager dashboard.

## Dependencies
- Existing GitHub repository
- Supabase PAT
- Supabase organization slug or ID
- Google OAuth client ID and secret
- Manager email
- GitHub Pages URL
- Local dev URL

## Sequence
### Phase 1: Foundation and env contract
**Deliverables**
- repo scaffolding
- multi-page Vite build
- shared TS modules
- Pages workflow
- env examples

**Acceptance Criteria**
- [ ] install, dev, build, preview scripts work
- [ ] repo path base handled cleanly
- [ ] no SPA router dependency

**Gate**
- Gate 1: Hawkeye approves architecture, file layout, and env contract

### Phase 2: Supabase provisioning and schema
**Deliverables**
- provisioning script
- migration template renderer
- Supabase CLI link/push scripts
- schema, RLS, RPC, seed
- generated DB types

**Acceptance Criteria**
- [ ] project can be created or reused
- [ ] migration renders manager email safely
- [ ] DB push succeeds non-interactively
- [ ] public direct access to bookings denied
- [ ] manager policies work via JWT email

**Gate**
- Gate 2: Hawkeye reviews API usage, SQL correctness, and security model

### Phase 3: Public app flow
**Deliverables**
- landing page
- motorcycle cards
- booking request form
- success/error states

**Acceptance Criteria**
- [ ] active motorcycles display
- [ ] valid booking request succeeds
- [ ] overlapping approved or active booking rejected

**Gate**
- Gate 3: Hawkeye reviews booking flow and client-side validation boundaries

### Phase 4: Admin app flow
**Deliverables**
- Google sign-in
- auth callback handling
- manager dashboard
- status transition actions
- notes editing

**Acceptance Criteria**
- [ ] manager can sign in
- [ ] wrong account is signed out and blocked
- [ ] bookings grouped sensibly by status and date

**Gate**
- Gate 4: Hawkeye reviews auth/session logic and admin mutation paths

### Phase 5: Docs, deploy, and final QA
**Deliverables**
- complete README
- bootstrap happy path
- deploy validation
- final acceptance evidence

**Acceptance Criteria**
- [ ] bootstrap flow completes with documented prerequisites
- [ ] frontend env files contain no secrets
- [ ] GitHub Actions Pages deploy workflow present and valid
- [ ] README covers setup, deploy, limitations, and manager email rotation

**Gate**
- Gate 5: Hawkeye final review, Chief spot-check on quality bar

## Test Plan
### Unit
- utility functions for URL/base handling
- date validation helpers
- reservation code helper if client-side helper exists

### Integration
- Supabase client reads active motorcycles
- RPC booking creation happy path and overlap rejection
- admin booking status updates
- auth callback session resolution

### Security / abuse
- anonymous `select` on bookings denied
- anonymous direct `insert` into bookings denied
- wrong-account signed-in user cannot read or mutate manager data
- browser bundle inspection confirms no secret keys present

### Manual QA script
1. Run bootstrap on fresh setup with valid env vars.
2. Run local dev and confirm `index.html`, `admin.html`, and `auth-callback.html` load.
3. Submit valid public booking request and record reservation code.
4. Attempt invalid date range and verify failure.
5. Approve booking as manager.
6. Attempt overlapping second booking for same motorcycle and confirm rejection.
7. Sign in with wrong Google account and verify sign-out / unauthorized state.
8. Build production bundle and verify Pages base path asset URLs.

## Rollout
- Feature flag: No
- Metrics to watch: build success, auth success, booking submission success, obvious console/runtime errors
- Rollback plan: revert repo to prior commit, redeploy Pages, optionally revert DB migration only if schema rollback is safe and explicitly authored

---

# HAWKEYE HANDOFF
Use this artifact as the contract. Your next output should not restate the brief. Produce implementation-obvious technical specs for M1-M5 with:
- exact file-by-file responsibilities
- exact Supabase Management API endpoints and request/response assumptions
- exact SQL migration content including RLS policies, grants, triggers, and RPC implementation
- exact OAuth redirect URL matrix for localhost and GitHub Pages path deployment
- exact Vite base-path handling strategy
- exact testing strategy and any tradeoffs where automation is brittle

Call out any requirement that is impossible, unsupported, or unstable with current Supabase APIs before Cowgirl starts building.

# COWGIRL HANDOFF
Do not improvise product scope. Build only what is in the artifact. If Hawkeye finds an unsupported automation step, replace magical behavior with honest script output and README instruction, not hidden manual tribal knowledge.

---

## Decision Log
[DL-20260312-01] Choose static multi-page Vite over SPA router
Rationale: GitHub Pages path hosting plus OAuth callback handling is simpler and less fragile.
Scope: frontend architecture and page structure
Revisit when: app grows beyond simple public/admin/callback split

[DL-20260312-02] Use single-manager email match in SQL policies for v1
Rationale: smallest strong authorization model for one-manager business
Scope: RLS and auth behavior
Revisit when: second privileged user is required

[DL-20260312-03] Public booking creation only through RPC
Rationale: direct anonymous table writes would weaken validation and policy clarity
Scope: bookings write path
Revisit when: customer accounts or richer workflows exist

[DL-20260312-04] Automate only deterministic setup steps
Rationale: fake automation is worse than one explicit manual step
Scope: scripts, README, provisioning behavior
Revisit when: Google Cloud or Supabase APIs support fuller provisioning safely

## Reasoning Trace
### Assumptions
- This should be handed to Concourse as Chief, not as a code-writing request in this thread.
- The team benefits more from milestone decomposition than from a giant one-shot prompt.

### Options considered
1. Pass through your raw prompt unchanged
2. Rewrite as one giant PRD only
3. Produce build brief plus roadmap plus work order plan

### Tradeoffs
- Option 1 is fast but sloppy. It invites scope confusion and weak sequencing.
- Option 2 is cleaner but still under-specifies execution order.
- Option 3 adds structure and review gates, which is what the crew is built for.

### Decision
Option 3.

### Consequences
Foreman can sequence. Hawkeye can spec without guessing. Cowgirl can build without pretending product decisions are still open.

### Verification
This decision is wrong if your Concourse workflow actually wants raw implementation prompts only and does not use milestones, gates, or role handoffs.

## State Heartbeat
State · Project: MOTO-RENTAL-GHP-SUPABASE
Phase: 0 · Milestone: Briefing
Focus: Convert operator intent into executable Concourse artifact
Last shipped: Build brief + PRD + roadmap + work order
Open loops: [1] Hawkeye technical specs [2] Cowgirl implementation
Risks (top 2): (a) Supabase API drift (b) GitHub Pages OAuth path mismatch
Next 2 steps: (a) Hawkeye writes exact technical specs (b) Foreman sequences build into work orders

## Blockers
- None for briefing.
- For implementation, external prerequisites remain mandatory: existing GitHub repo, Google OAuth client, Supabase PAT, organization slug or ID, manager email, GitHub Pages URL.
