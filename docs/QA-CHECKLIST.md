# Manual QA Checklist

Structured manual QA checklist covering all critical paths: bootstrap, page loading, booking flow, validation, admin actions, auth security, and production build.

---

## 1. Bootstrap on Fresh Setup

**Prerequisites:** Valid `.env.setup` with real Supabase credentials.

- [ ] Run `bash scripts/bootstrap.sh`
- [ ] Verify: script completes without errors
- [ ] Verify: `.env.local` and `.env.production` files created with `VITE_*` variables
- [ ] Verify: `src/lib/database.types.ts` generated (not the placeholder)
- [ ] Verify: next steps printed with OAuth configuration URLs

## 2. Local Dev — Pages Load

**Prerequisites:** Bootstrap complete, `npm install` done.

- [ ] Run `npm run dev`
- [ ] Open `http://localhost:5173/` — public landing page loads with hero + motorcycle cards
- [ ] Open `http://localhost:5173/admin.html` — admin page loads (shows sign-in button)
- [ ] Open `http://localhost:5173/auth-callback.html` — auth callback page loads (shows "Signing in...")

## 3. Public Booking — Valid Submission

**Prerequisites:** Local dev running, at least one active motorcycle in database.

- [ ] On landing page, click "Book Now" on a motorcycle card
- [ ] Fill in: name, email, WhatsApp (optional), start date (future), end date (after start), message (optional)
- [ ] Verify: nights count and total price display correctly as dates change
- [ ] Submit the booking form
- [ ] Verify: success state shows with reservation code
- [ ] Record the reservation code: `__________`

## 4. Public Booking — Invalid Date Range

- [ ] Attempt to set end date before or equal to start date
- [ ] Verify: form shows validation error, submit is blocked
- [ ] Attempt to set start date in the past
- [ ] Verify: form shows validation error

## 5. Admin — Approve Booking

**Prerequisites:** Manager signed in with correct Google account, at least one pending booking.

- [ ] Sign in at `admin.html` with the manager Google account
- [ ] Verify: dashboard loads with booking groups
- [ ] Find a pending booking
- [ ] Click "Approve"
- [ ] Verify: booking moves from Pending to Approved/Upcoming section
- [ ] Verify: status badge changes to "approved" (blue)

## 6. Overlapping Booking Rejection

**Prerequisites:** An approved or active booking exists for a motorcycle within a date range.

- [ ] On the public page, attempt to book the same motorcycle with overlapping dates
- [ ] Submit the form
- [ ] Verify: RPC returns an error (motorcycle unavailable / date conflict)
- [ ] Verify: error message displayed to user

## 7. Wrong-Account Sign-Out

- [ ] Sign in at `admin.html` with a Google account that is NOT the manager email
- [ ] Verify: immediately signed out
- [ ] Verify: "Access Denied" message shown with the rejected email
- [ ] Verify: "Sign in with a different account" button is present and functional

## 8. Production Build — Asset Paths

- [ ] Run `npm run build`
- [ ] Verify: build succeeds without errors
- [ ] Run `npm run preview`
- [ ] Open the preview URL
- [ ] Verify: all three pages load correctly (index, admin, auth-callback)
- [ ] Verify: CSS and JS assets load (no 404s in browser console)
- [ ] If `VITE_BASE_PATH` is set, verify asset URLs include the base path prefix

---

## Additional Checks

### Type Safety

- [ ] `npm run typecheck` passes with zero errors

### Lint

- [ ] `npm run lint` passes (or only pre-existing warnings)

### Manager Notes

- [ ] On admin dashboard, click "Edit Notes" on any booking
- [ ] Enter notes, click Save
- [ ] Verify: notes persist after dashboard re-renders
- [ ] Click "Edit Notes" again, click Cancel
- [ ] Verify: textarea closes, original notes displayed

### Destructive Actions

- [ ] Click "Reject" on a pending booking — confirm dialog appears
- [ ] Cancel the confirm — booking unchanged
- [ ] Confirm the reject — booking moves to Cancelled/Rejected section
- [ ] Click "Cancel" on an approved booking — confirm dialog appears
- [ ] Confirm — booking moves to Cancelled/Rejected
