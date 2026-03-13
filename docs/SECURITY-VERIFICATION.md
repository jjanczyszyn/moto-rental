# Security Verification — Negative-Path Tests

Verification steps for RLS policies, RPC constraints, auth guards, and bundle hygiene. Each test includes exact commands/queries and expected results.

---

## 1. Anonymous Bookings Table Access — SELECT Denied

Unauthenticated (anon key) users cannot read the bookings table directly.

```js
// Browser console or JS with anon key only (no auth token)
const { data, error } = await supabase.from('bookings').select('*');
console.log({ data, error });
```

- [ ] Run query with anon key (no auth token)
- [ ] Verify: empty result set — zero rows returned
- [ ] Verify: no booking data leaked to anonymous users

## 2. Anonymous Bookings Table Access — INSERT Denied

Unauthenticated users cannot insert directly into bookings (must use RPC).

```js
const { data, error } = await supabase.from('bookings').insert({
  customer_name: 'Test Attacker',
  motorcycle_id: '<any-motorcycle-id>',
  start_date: '2025-05-01',
  end_date: '2025-05-03',
  status: 'approved',
});
console.log({ data, error });
```

- [ ] Attempt direct INSERT into bookings with anon key
- [ ] Verify: RLS policy blocks the insert — error returned
- [ ] Verify: the only way to create bookings is via `create_booking_request` RPC

## 3. Anonymous Bookings Table Access — UPDATE/DELETE Denied

```js
// UPDATE attempt
const { data: upd, error: updErr } = await supabase
  .from('bookings')
  .update({ status: 'approved' })
  .eq('id', '<any-booking-id>');
console.log('UPDATE:', { data: upd, error: updErr });

// DELETE attempt
const { data: del, error: delErr } = await supabase
  .from('bookings')
  .delete()
  .eq('id', '<any-booking-id>');
console.log('DELETE:', { data: del, error: delErr });
```

- [ ] Attempt UPDATE on bookings with anon key — denied
- [ ] Attempt DELETE on bookings with anon key — denied

## 4. Wrong-Account User — Cannot Read Manager Data

A signed-in user whose email does NOT match `MANAGER_EMAIL` cannot access bookings.

```
Steps:
1. Sign in at admin.html with a non-manager Google account
2. Before the UI signs them out, open browser DevTools → Console
3. Run the following with the wrong-account JWT still active:
```

```js
const { data, error } = await supabase.from('bookings').select('*');
console.log({ data, error });
```

- [ ] Signed-in non-manager user gets zero rows from bookings SELECT
- [ ] RLS policy restricts to `auth.jwt() ->> 'email' = MANAGER_EMAIL` only
- [ ] No booking data visible to wrong account at the DB layer

## 5. Wrong-Account User — Cannot Mutate Manager Data

```js
// With wrong-account JWT active in browser console:

// Status update attempt
const { data: s, error: sErr } = await supabase
  .from('bookings')
  .update({ status: 'approved' })
  .eq('id', '<booking-id>');
console.log('Status update:', { data: s, error: sErr });

// Notes update attempt
const { data: n, error: nErr } = await supabase
  .from('bookings')
  .update({ manager_notes: 'hacked' })
  .eq('id', '<booking-id>');
console.log('Notes update:', { data: n, error: nErr });
```

- [ ] Status update with wrong-account JWT — denied (zero rows affected)
- [ ] Notes update with wrong-account JWT — denied (zero rows affected)

## 6. Browser Bundle — No Secret Keys

Verify the production build does not contain secret/private keys.

```bash
npm run build
grep -r "service_role" dist/ || echo "PASS: no service_role key found"
grep -r "SUPABASE_ACCESS_TOKEN" dist/ || echo "PASS: no access token found"
grep -r "SUPABASE_DB_PASSWORD" dist/ || echo "PASS: no db password found"
```

- [ ] `dist/` contains NO `service_role` key
- [ ] `dist/` contains NO `SUPABASE_ACCESS_TOKEN`
- [ ] `dist/` contains NO `SUPABASE_DB_PASSWORD`
- [ ] Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are present (these are publishable)

## 7. RPC Overlap Rejection

Verify `create_booking_request` RPC rejects overlapping date ranges.

```
Steps:
1. Create a booking for motorcycle X from 2025-04-01 to 2025-04-05
2. Approve that booking in admin dashboard (status = 'approved')
3. Attempt a second booking for motorcycle X from 2025-04-03 to 2025-04-07
```

```js
// Step 3 — second booking via RPC
const { data, error } = await supabase.rpc('create_booking_request', {
  p_motorcycle_id: '<motorcycle-X-id>',
  p_customer_name: 'Overlap Test',
  p_start_date: '2025-04-03',
  p_end_date: '2025-04-07',
});
console.log({ data, error });
```

- [ ] First booking succeeds with reservation code
- [ ] Second booking with overlapping dates returns error
- [ ] Error message indicates date conflict / motorcycle unavailable

## 8. Direct Motorcycles Table Mutation — Denied

Anonymous users cannot modify the motorcycles table.

```js
// UPDATE attempt
const { data: upd, error: updErr } = await supabase
  .from('motorcycles')
  .update({ daily_rate_thb: 0 })
  .eq('id', '<any-motorcycle-id>');
console.log('UPDATE:', { data: upd, error: updErr });

// DELETE attempt
const { data: del, error: delErr } = await supabase
  .from('motorcycles')
  .delete()
  .eq('id', '<any-motorcycle-id>');
console.log('DELETE:', { data: del, error: delErr });

// INSERT attempt
const { data: ins, error: insErr } = await supabase
  .from('motorcycles')
  .insert({ name: 'Fake Bike', brand: 'Fake', model: 'X', daily_rate_thb: 0, is_active: true });
console.log('INSERT:', { data: ins, error: insErr });
```

- [ ] UPDATE on motorcycles — denied
- [ ] DELETE on motorcycles — denied
- [ ] INSERT on motorcycles — denied
- [ ] Only SELECT of active motorcycles is allowed for anonymous users
