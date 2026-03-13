# QA1-A: Product Piece Checklist

**Date:** 2026-03-13
**Agent:** cowgirl-10
**Project:** moto-rental

## Product Pieces — Completeness Audit

### Core Features

| # | Feature | Status | Source File | Notes |
|---|---------|--------|-------------|-------|
| 1 | Public landing page with hero | PRESENT | index.html, main-public.ts | Renders dynamically |
| 2 | 3 motorcycle cards with images | PRESENT | business-config.ts | Yamaha XT 125, Blue Genesis Click, Pink Genesis Click |
| 3 | 6-step booking wizard | PRESENT | main-public.ts | Steps: dates → bike → pricing → contact → contract → confirm |
| 4 | Tiered pricing calculator | PRESENT | pricing.ts | Daily $20, weekly 10%, biweekly 18%, monthly $400 cap |
| 5 | Digital contract with signature | PRESENT | main-public.ts | Typed name + canvas signature + terms checkbox |
| 6 | Reservation code generation | PRESENT | 0001_init.sql (RPC) | create_booking_request() generates code |
| 7 | Customer access secret | PRESENT | 0001_init.sql (RPC) | Hashed secret for customer lookup |
| 8 | Customer lookup page | PRESENT | customer.html, main-customer.ts | Code + secret → booking details |
| 9 | Admin dashboard (Google auth) | PRESENT | admin.html, main-admin.ts | Email-based access control |
| 10 | Booking status management | PRESENT | main-admin.ts | pending → approved → active → completed/cancelled |
| 11 | Delivery tracking | PRESENT | main-admin.ts | scheduled → delivered → completed / issue_reported |
| 12 | Payment status tracking | PRESENT | main-admin.ts | unpaid / paid / refunded badges |
| 13 | OAuth callback handler | PRESENT | auth-callback.html | 5s timeout, redirect to admin |
| 14 | GitHub Pages deployment | PRESENT | deploy-pages.yml | CI/CD on push to main |

### Data Model

| # | Piece | Status | Notes |
|---|-------|--------|-------|
| 15 | Motorcycles table | PRESENT | id, slug, name, brand, model, year, daily_rate, image_url, etc. |
| 16 | Bookings table | PRESENT | 30+ columns: customer info, pricing, delivery, contract, status |
| 17 | RLS policies | PRESENT | Public: active motorcycles read-only; Manager: full booking access |
| 18 | create_booking_request RPC | PRESENT | SECURITY DEFINER, validates dates/overlap, generates codes |
| 19 | get_booking_with_details RPC | PRESENT | Customer lookup by code + secret hash |

### Business Configuration

| # | Piece | Status | Value | Notes |
|---|-------|--------|-------|-------|
| 20 | Daily rate | PRESENT | $20/day | business-config.ts |
| 21 | Weekly discount | PRESENT | 10% (7+ days) | pricing.ts |
| 22 | Biweekly discount | PRESENT | 18% (14+ days) | pricing.ts |
| 23 | Monthly cap | PRESENT | $400/month | pricing.ts |
| 24 | Security deposit | PRESENT | $100 | business-config.ts |
| 25 | Payment methods | PRESENT | Venmo, PayPal, Wise, Cash | business-config.ts |
| 26 | WhatsApp contact | PRESENT | +50589750052 | business-config.ts |
| 27 | Insurance expiry | PRESENT | 2026-06-11 | business-config.ts |
| 28 | Review link | EMPTY | '' | business-config.ts — not configured |
| 29 | Feature badges | PRESENT | Delivery, Surf rack, 2 helmets | business-config.ts |

### Missing / Gaps

| # | Gap | Severity | Recommendation |
|---|-----|----------|----------------|
| G1 | No automated tests | Medium | Add Vitest for pricing + validation |
| G2 | Review link not configured | Low | Set Google Maps review URL when ready |
| G3 | No error boundary / offline handling | Low | Progressive enhancement for future |
| G4 | No rate limiting on booking RPC | Medium | Supabase edge function or rate limit policy |
| G5 | Insurance expiry date hardcoded | Low | Move to env var or admin config |

## Verdict

**Product is feature-complete for MVP.** All 14 core features present. 19 data model pieces verified. 1 config gap (review link empty). No blockers for launch — gaps are enhancement-tier.
