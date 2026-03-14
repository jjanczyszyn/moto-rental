# E2E Deployed Site QA Report

**WO:** WO-20260314-005
**Author:** hawkeye-5
**Date:** 2026-03-14
**Site:** https://jjanczyszyn.github.io/moto-rental/
**Status:** PARTIAL — blocked on WO-004 (image path fix) for deployed verification

---

## Executive Summary

Source code QA is **PASS with 1 HIGH finding**. Deployed site verification is **BLOCKED** — WO-004 (cowgirl-7, image path fix) has not started. Pages load but are JS-rendered SPAs, so deployed content cannot be verified until the fix ships and GitHub Pages redeploys.

---

## Pages Verified (Source Code)

| Page | URL | Loads | Structure | Notes |
|------|-----|-------|-----------|-------|
| Landing | `/moto-rental/` | Yes | Complete | Hero + 3 motorcycle cards + booking wizard |
| Admin | `/moto-rental/admin.html` | Yes | Complete | Auth gate + dashboard + delivery board |
| Customer | `/moto-rental/customer.html` | Yes | Complete | Lookup form + reservation display |
| Auth Callback | `/moto-rental/auth-callback.html` | Yes | Complete | OAuth redirect handler |

---

## Flow Verification

### Flow 1: Booking Wizard (6 Steps) — PASS
1. **Dates** — Calendar picker, past-date prevention, booked-date exclusion ✓
2. **Choose** — Motorcycle selection with images from Supabase ✓
3. **Pricing** — Tiered pricing (daily/weekly/biweekly/monthly) + $100 deposit ✓
4. **Details** — Name (required), WhatsApp (required), email (optional), payment method ✓
5. **Contract** — Terms checkbox, typed signature, canvas signature ✓
6. **Confirm** — Summary display, RPC submission, reservation code + secret output ✓

### Flow 2: Customer Lookup — PASS
- Form input for code + secret ✓
- Direct link support via query params (`?code=X&secret=Y`) ✓
- Auto-triggers lookup when both params present ✓
- Displays full reservation details including delivery and pricing ✓

### Flow 3: Admin Dashboard — PASS
- Google OAuth redirect with correct base path ✓
- Email verification against MANAGER_EMAIL ✓
- Access denied for wrong email ✓
- Three views: By Status, By Motorcycle, Deliveries ✓
- Status transitions: pending→approved→active→completed ✓
- Delivery board with date filters ✓
- Manager notes CRUD ✓
- Metrics bar (earnings, active, occupancy, pending) ✓

### Flow 4: Auth — PASS
- OAuth callback race condition guard ✓
- 5-second timeout fallback ✓
- Correct redirect to admin.html with base path ✓

---

## Findings

### HIGH Severity

| # | Issue | File | Lines |
|---|-------|------|-------|
| 1 | **Customer name/signature NOT HTML-escaped in contract display** — XSS risk via booking form name field rendered into contract template without `escapeHtml()` | main-public.ts | 932, 962, 992 |

`escapeHtml()` utility exists in `src/lib/utils.ts` but is not applied to these template insertions. Fix: wrap `wizardCustomerName` and `wizardTypedSignature` with `escapeHtml()` before rendering.

### MEDIUM Severity

| # | Issue | File | Lines |
|---|-------|------|-------|
| 2 | WhatsApp required but email optional — validation message may confuse users expecting either/or | main-public.ts | 818 |

### LOW Severity

| # | Issue | Notes |
|---|-------|-------|
| 3 | No minimum advance notice validation (same-day booking possible) | Enhancement |
| 4 | Logo.png oversized (280 KB) | Optimize to <50 KB or WebP |
| 5 | Review link not configured (empty string in business-config.ts:61) | By design — future feature |

---

## Asset & Path Verification

| Check | Status |
|-------|--------|
| Vite base path (`VITE_BASE_PATH=/moto-rental/`) | ✓ PASS |
| All HTML files use relative paths processed by Vite | ✓ PASS |
| Auth callback URL includes base path | ✓ PASS |
| Admin redirect includes base path | ✓ PASS |
| Favicon and touch icons present | ✓ PASS |
| Motorcycle images in `/public/images/` | ✓ PASS (3 files) |
| Supabase image URLs used in templates | ✓ PASS |

---

## Security Verification

| Check | Status |
|-------|--------|
| `escapeHtml()` utility present | ✓ PASS |
| `escapeAttr()` used in admin data attributes | ✓ PASS |
| URL validation blocks `javascript:` protocol | ✓ PASS |
| RLS blocks direct booking table reads | ✓ PASS (RPC only) |
| Customer secret stored as SHA256 hash | ✓ PASS |
| Wrong manager email shows Access Denied | ✓ PASS |
| OAuth callback race condition guard | ✓ PASS |

---

## Deployed Verification — BLOCKED

Cannot verify the following until WO-004 ships:
- [ ] Landing page renders hero + motorcycle cards with images
- [ ] Motorcycle images load from correct URLs
- [ ] Booking wizard renders all 6 steps visually
- [ ] Admin page auth redirect fires
- [ ] Customer page form renders
- [ ] No JS console errors in browser
- [ ] All assets load under /moto-rental/ base path
- [ ] Responsive layout at 375px, 768px, desktop

**Dependency:** WO-20260314-004 (cowgirl-7) — "Fix Image Path Handling for GitHub Pages Base Path" — currently `not_started`.

---

## Recommendation

1. **URGENT:** Fix XSS in contract template (Finding #1) — 3 lines to change
2. Complete WO-004 and redeploy to unblock deployed verification
3. After deploy, re-run this QA against live site with browser DevTools

---

*hawkeye-5 | WO-20260314-005 | 2026-03-14*
