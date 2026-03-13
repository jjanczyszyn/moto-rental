# QA1-A: Test Matrix

**Date:** 2026-03-13
**Agent:** cowgirl-10
**Project:** moto-rental

## Public Booking Flow

| # | Test Case | Type | Priority | Status |
|---|-----------|------|----------|--------|
| P1 | Landing page loads with 3 motorcycle cards | Smoke | P0 | Manual |
| P2 | Motorcycle images load from /images/ paths | Visual | P0 | Manual |
| P3 | "Book a Bike Now" opens wizard at step 1 | Functional | P0 | Manual |
| P4 | Date picker enforces start < end | Validation | P1 | Automatable |
| P5 | Date picker rejects past dates | Validation | P1 | Automatable |
| P6 | Motorcycle selection shows available bikes only | Functional | P0 | Manual |
| P7 | Pricing calculates correctly for 1-day rental | Business | P0 | Automatable |
| P8 | Pricing applies 10% weekly discount (7+ days) | Business | P0 | Automatable |
| P9 | Pricing applies 18% biweekly discount (14+ days) | Business | P0 | Automatable |
| P10 | Pricing caps at monthly rate (30+ days) | Business | P0 | Automatable |
| P11 | Security deposit ($100) shown in total | Business | P1 | Automatable |
| P12 | Contact form validates WhatsApp (required) | Validation | P1 | Automatable |
| P13 | Contact form validates email format (optional) | Validation | P2 | Automatable |
| P14 | Contract text rendered with booking details | Functional | P1 | Manual |
| P15 | Typed signature name required | Validation | P1 | Manual |
| P16 | Canvas signature capture works (draw + undo) | Functional | P1 | Manual |
| P17 | Terms checkbox required before submit | Validation | P1 | Manual |
| P18 | Booking submission creates record via RPC | Integration | P0 | Manual |
| P19 | Confirmation shows reservation code + secret | Functional | P0 | Manual |
| P20 | Wizard "Back" navigation preserves state | Functional | P2 | Manual |

## Customer Lookup Flow

| # | Test Case | Type | Priority | Status |
|---|-----------|------|----------|--------|
| C1 | Lookup page loads with code + secret fields | Smoke | P0 | Manual |
| C2 | Valid code + secret returns booking details | Functional | P0 | Manual |
| C3 | Invalid code shows error message | Error | P1 | Manual |
| C4 | Invalid secret shows access denied | Security | P0 | Manual |
| C5 | Booking details show motorcycle image | Visual | P1 | Manual |
| C6 | Pricing breakdown matches booking | Business | P1 | Manual |
| C7 | Delivery details displayed when available | Functional | P1 | Manual |
| C8 | WhatsApp contact link works | Functional | P2 | Manual |

## Admin Dashboard Flow

| # | Test Case | Type | Priority | Status |
|---|-----------|------|----------|--------|
| A1 | Admin page redirects to Google login | Auth | P0 | Manual |
| A2 | Authorized email grants access | Auth | P0 | Manual |
| A3 | Unauthorized email shows "Access Denied" | Security | P0 | Manual |
| A4 | Dashboard loads all bookings grouped by status | Functional | P0 | Manual |
| A5 | Approve button transitions pending → approved | Functional | P0 | Manual |
| A6 | Reject button transitions pending → cancelled | Functional | P1 | Manual |
| A7 | Mark Active transitions approved → active | Functional | P1 | Manual |
| A8 | Mark Completed transitions active → completed | Functional | P1 | Manual |
| A9 | Cancel button works on approved/active bookings | Functional | P1 | Manual |
| A10 | Delivery board shows today/tomorrow/7-day filters | Functional | P1 | Manual |
| A11 | Delivery status transitions: scheduled → delivered → completed | Functional | P1 | Manual |
| A12 | Payment status badges: unpaid/paid/refunded | Visual | P2 | Manual |
| A13 | Manager notes field saves and displays | Functional | P2 | Manual |
| A14 | Sign out button works | Auth | P1 | Manual |

## OAuth Callback

| # | Test Case | Type | Priority | Status |
|---|-----------|------|----------|--------|
| O1 | Callback page handles SIGNED_IN event | Auth | P0 | Manual |
| O2 | Redirect to admin on successful auth | Auth | P0 | Manual |
| O3 | 5s timeout shows error on auth failure | Error | P1 | Manual |

## Cross-Cutting

| # | Test Case | Type | Priority | Status |
|---|-----------|------|----------|--------|
| X1 | All pages responsive on mobile (375px) | Responsive | P1 | Manual |
| X2 | All pages responsive on tablet (768px) | Responsive | P2 | Manual |
| X3 | No console errors on any page | Quality | P1 | Manual |
| X4 | Supabase RLS blocks direct booking table reads | Security | P0 | Manual |
| X5 | GitHub Pages deployment serves all 4 entry points | Deploy | P0 | Manual |

## Summary

- **Total test cases:** 46
- **P0 (must-pass):** 19
- **P1 (should-pass):** 19
- **P2 (nice-to-pass):** 8
- **Automatable (unit/integration):** 8 (pricing + validation)
- **Manual only:** 38
