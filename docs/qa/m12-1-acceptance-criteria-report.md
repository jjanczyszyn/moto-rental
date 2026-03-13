# QA Report — M12-1: Acceptance Criteria Validation

**Date:** 2026-03-13
**Validator:** cowgirl-3
**Build:** `vite build` clean, 4 entrypoints (index, admin, customer, auth-callback)
**TypeCheck:** `tsc --noEmit` clean, zero errors

---

## Acceptance Criteria Results

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Public site builds and runs locally | PASS | `vite build` produces 4 HTML entrypoints, 7 JS/CSS assets. `tsc --noEmit` clean. |
| 2 | 3 motorcycles: Yamaha XT 125, Blue Genesis Click, Pink Genesis Click | PASS | `business-config.ts` lines 31-59: all 3 defined with slug, name, brand, model, color, transmission. |
| 3 | Each motorcycle has an image path with actual assets | PASS | `public/images/` contains `yamaha-xt-125-white.jpg`, `blue-genesis-click.jpg`, `pink-genesis-click.jpg` plus `ATTRIBUTION.md`. |
| 4 | Public user can complete guided booking flow | PASS | 6-step wizard: Choose (step 1) -> Dates (step 2) -> Pricing (step 3) -> Details (step 4) -> Contract (step 5) -> Confirmation (step 6). All steps render, wire, and navigate correctly. |
| 5 | Live pricing and date-range validation | PASS | `calculatePricing()` used 16 times across public flow. 4-tier pricing (daily/weekly/biweekly/monthly). Date validation via `isValidDateRange()` and `calculateNights()`. |
| 6 | Availability blocks overlapping bookings | PASS | RPC `create_booking_request` checks `v_overlap_count` against approved/active bookings with date range overlap. Raises exception if > 0. Present in migrations 0004, 0009, 0010. |
| 7 | Manager can sign in with Google | PASS | `main-admin.ts` imports `signInWithGoogle` from auth module. `getSession()` + `onAuthStateChange()` handle auth flow. |
| 8 | Wrong Google account cannot use admin dashboard | PASS | `main-admin.ts` line 890: checks `user.email?.toLowerCase() === MANAGER_EMAIL.toLowerCase()`. Mismatch triggers `signOut()` + `renderUnauthorized()` ("Access Denied"). |
| 9 | Manager can view and update all bookings | PASS | Admin loads all bookings with `select('*, motorcycles(name, brand, model)')`. Status actions (approve/reject/activate/complete/cancel), delivery status dropdown, payment status dropdown, manager notes editing all present. |
| 10 | Manager can use day-grouped delivery board | PASS | `renderDeliveryBoard()` with day-grouped cards, filter bar (Today/Tomorrow/7 Days/Custom), delivery cards with time, status badges, Mark Delivered/Mark Issue actions, Copy WhatsApp, Open Map. |
| 11 | Customer can access only their own reservation | PASS | `main-customer.ts` uses `lookup_booking` RPC with `p_reservation_code` + `p_access_secret`. Secret is hashed server-side (`customer_access_secret_hash`). No way to enumerate bookings. |
| 12 | Customer view stays low-sensitivity | PASS | Customer view shows: reservation code, status, motorcycle, dates, pricing, payment method/status, delivery info, contract signed date. No internal IDs, admin notes, or other customers' data exposed. |
| 13 | Contract signing data is stored and printable | PASS | `typed_signature_name`, `drawn_signature_data`, `contract_signed_at`, `contract_text` all stored via RPC. `showPrintableContract()` opens print-friendly window with full contract + drawn signature image. Print Contract button on confirmation page. |
| 14 | GitHub Pages workflow still works | PASS | `.github/workflows/deploy-pages.yml` exists. Build produces static `dist/` with 4 HTML pages. `VITE_BASE_PATH` configured for GH Pages. |
| 15 | README clearly explains phased roadmap and deferred features | PASS | README has "Known Limitations" section (5 items) and "Roadmap" section with milestones M1-M11 all marked complete. Pages list, project structure, and environment docs all current. |

---

## Summary

**15/15 acceptance criteria PASS.** No bugs found. Build and typecheck clean. All Phase 1 features implemented and verified.
