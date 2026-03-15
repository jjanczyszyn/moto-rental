# Chief Build Brief + Change Spec
## Project: Moto Rental App upgrade inside existing Concourse-managed repository
## Artifact Type: Existing-project change spec for Foreman → Hawkeye → Cowgirl
## Status: Ready for operator review

---

## 1. Outcome
Upgrade the existing **Moto Rental App on GitHub Pages + Supabase** from a small public booking-request tool into a more complete rental operations product, while **preserving the existing architecture**:

- Frontend hosted on **GitHub Pages only**
- Backend on **Supabase**
- **No custom backend server**
- **Vite + React + TypeScript**
- **Google social login for manager only**
- Real security enforced by **Supabase RLS, RPC, Storage policies, and Auth**

This is **not** a greenfield build. It must be implemented as a **delta on top of the existing project** with minimal churn, explicit migrations, and no fake rewrites.

---

## 2. Chief framing
This artifact follows the Chief Initialization Pack posture:

- artifact-first
- smallest shippable slices
- explicit assumptions
- clear non-goals
- no implementation theater
- no pretending GitHub Pages can host backend behavior
- no pretending deferred features are done

Expected handoff sequence:

1. **Foreman**: sequence milestones and identify repo touchpoints
2. **Hawkeye**: turn this into detailed technical work orders by slice
3. **Cowgirl**: implement in the existing codebase

---

## 3. What changes, at a glance

### Keep from existing spec
- GitHub Pages frontend
- Supabase backend
- Vite multi-page app
- Manager-only Google login
- Public booking entry flow
- Supabase CLI + Management API setup automation
- Strong emphasis on honest setup prerequisites

### Change / add
- Replace seeded motorcycles with the real 3 bikes
- Upgrade public flow from flat request form to guided booking flow
- Add pricing model instead of one opaque quote
- Add customer reservation access without full customer accounts
- Add contract review + signing
- Add structured delivery details
- Add admin delivery board by day
- Add review CTA / reminder helper
- Add image asset pipeline for the 3 bikes
- Defer OCR, identity uploads, payment proof uploads, and extension requests until later phases

---

## 4. Product decisions

### 4.1 Motorcycle catalog
Seed and display exactly these 3 motorcycles:

1. **Yamaha XT 125 White**
   - slug: `yamaha-xt-125-white`
   - name: `Yamaha XT 125`
   - brand: `Yamaha`
   - model: `XT 125`
   - color: `White`
   - transmission: `Manual`

2. **Blue Genesis Click Automatic**
   - slug: `blue-genesis-click`
   - name: `Blue Genesis Click`
   - brand: `Genesis`
   - model: `Click`
   - color: `Blue`
   - transmission: `Automatic`

3. **Pink Genesis Click Automatic**
   - slug: `pink-genesis-click`
   - name: `Pink Genesis Click`
   - brand: `Genesis`
   - model: `Click`
   - color: `Pink`
   - transmission: `Automatic`

### 4.2 Universal inclusions
These are business-wide constants, not database fields:

- Surf racks included
- 2 helmets included
- Delivery included

Render them from config/UI. Do **not** store them as per-row columns.

### 4.3 Registration numbers
Do **not** store registration numbers in this phase.

### 4.4 Architecture guardrail
This remains an **existing-project upgrade**, not a rewrite. Preserve current repo structure where reasonable. Only add pages/modules/tables that materially support the new behavior.

---

## 5. Design review and required adjustments
The prior concept was directionally right but still had a few traps. Apply these corrections.

### 5.1 Good
- Minimal, white-first visual system
- Soft colorful gradients as accents
- Guided flow instead of one large form
- Mobile-first layout
- Separate admin surface
- Operational delivery board

### 5.2 Needs tightening

#### A. Avoid overstuffed home page
Do not turn the landing page into a wall of controls. Keep it to:
- compact hero
- 3 motorcycle cards
- one primary CTA into booking flow
- small included-features strip
- manager WhatsApp + map links

#### B. Booking should feel like a wizard, not a dashboard
Use progressive steps with a compact live summary.
Only reveal what is necessary at each step.

#### C. Selection state must be visually obvious
When a motorcycle is selected:
- enlarge or highlight the selected card
- swap in its larger image in the summary panel / booking header
- make transmission, color, and pricing immediately readable

#### D. Delivery details need to be operationally usable
Do not ask only for generic notes. Require:
- delivery date/time
- map link
- optional extra description

#### E. Customer area must stay low-sensitivity
Do not let the customer view become a mini CRM. It should show only:
- reservation code
- selected bike
- date range
- payment method
- delivery summary
- contract status
- manager contact CTA
- review CTA after completion

#### F. Defer upload-heavy complexity
OCR-assisted identity collection and proof uploads should **not** dilute the Phase 1 build. Mark them explicitly deferred.

---

## 6. Phase plan

## Phase 1: Core product
Must be fully working before any Phase 2 work begins.

Includes:
- updated motorcycle catalog
- improved landing page
- guided booking flow
- date range selection
- pricing logic
- availability checks
- booking creation
- booking confirmation
- lightweight customer reservation access
- admin dashboard
- admin delivery board by day
- contract review and signing
- delivery details capture
- manager WhatsApp link
- map link
- GitHub Pages deploy
- Supabase schema / RLS / RPC updates
- image asset handling for the 3 motorcycles

## Phase 2: Identity and payment uploads
Only after Phase 1 is stable.

Includes:
- identity document upload
- OCR-assisted identity collection
- payment proof upload
- payment proof review in admin

Explicit instruction:
Do not fake these. Do not scaffold half-finished production paths. Document them as deferred.

## Phase 3: Extensions
Only later.

Includes:
- customer extension request flow
- admin approve/reject extension flow
- updated pricing after extension approval

---

## 7. Scope for Phase 1

### 7.1 Landing page
Replace the thin public page with a cleaner minimal landing page.

Show:
- business name: **Karen & JJ motorcycle rental**
- short subheading
- 3 motorcycle cards
- included features strip:
  - Surf racks included
  - 2 helmets included
  - Delivery included
- manager WhatsApp contact link
- map/location link
- CTA to begin booking

Suggested subheading:
> Reliable scooter & motorcycle rentals with surf racks, 2 helmets, and delivery included.

### 7.2 Motorcycle card requirements
Each card must show:
- image
- name
- transmission
- color
- daily price anchor
- simple CTA like `Book this moto`

### 7.3 Selected-state behavior
When a user selects a bike:
- selected card becomes visually prominent
- larger image appears in booking summary / reservation panel
- selected bike details follow through the rest of the booking flow

---

## 8. Image asset requirement
Add a requirement to **download or source images** for the 3 motorcycle models so the UI can show actual visuals when the user selects a bike.

### 8.1 What to do
- Add image assets for:
  - Yamaha XT 125 White
  - Blue Genesis Click
  - Pink Genesis Click
- Use owner-supplied photos if available
- Otherwise use legally usable product-style images or temporary placeholders with honest TODOs

### 8.2 Important constraint
Do not silently scrape random copyrighted images into production assets.
If exact cleared images are not available, use:
- clearly named placeholder assets
- documented TODO in README / spec

### 8.3 UX requirement
When a motorcycle is selected for reservation, show that motorcycle’s image prominently in:
- booking step header or summary panel
- confirmation page
- customer reservation page
- admin reservation detail page

### 8.4 Asset handling
Store images as normal frontend static assets appropriate for GitHub Pages.
Optimize filenames and dimensions for fast mobile load.

---

## 9. Shared business config
Centralize the following in a shared config module:

- `businessName = Karen & JJ motorcycle rental`
- `managerName = Karen Adrana Espinoza Ruiz`
- `managerWhatsappNumber = +50589750052`
- `managerWhatsappLink = https://wa.me/50589750052`
- `mapLink = https://maps.app.goo.gl/ZCk4z9estajyz2JLA?g_st=ic`
- pricing defaults
- payment methods
- review link placeholder
- motorcycle metadata
- universal included-features strings

Pricing defaults:
- `$20/day`
- `$400/month`
- weekly discount: `10%`
- two-week discount: `18%`
- refundable security deposit: `$100`
- insurance valid until `2026-06-11`

Payment methods:
- Venmo `@justina-lydia`
- PayPal `justinalydiacuddles@gmail.com`
- Wise `https://wise.com/pay/me/justynaj102`
- Cash

---

## 10. Guided booking flow for Phase 1
Replace the old flat booking request form.

### Step 1: Choose motorcycle
- select one of the 3 bikes
- show image + details

### Step 2: Choose rental date range
- calendar range picker
- derive rental days from selected range
- block obviously invalid ranges

### Step 3: Review live pricing
Show:
- base subtotal
- discount amount
- rental total
- refundable deposit
- total due

### Step 4: Enter contact and delivery details
Collect:
- full name
- WhatsApp number
- optional email
- payment method
- delivery date/time
- delivery map link
- additional delivery instructions

### Step 5: Review and sign contract
Collect:
- typed full name as signature
- drawn signature
- terms acceptance checkbox

### Step 6: Confirmation
Show:
- reservation code
- selected motorcycle + image
- rental date range
- payment method
- delivery summary
- manager WhatsApp link
- customer reservation access instructions

---

## 11. Pricing logic
Replace the single `total_quote` concept with explicit pricing fields and logic.

Rules:
- 1 to 6 days: standard daily rate
- 7 to 13 days: weekly discount
- 14 to 27 days: biweekly discount
- 28+ days: best-price logic favoring monthly pricing where appropriate

Store on bookings:
- `base_price_usd`
- `discount_usd`
- `rental_total_usd`
- `security_deposit_usd`
- `total_due_usd`
- `rental_days`

Do not leave pricing as opaque manager math.

---

## 12. Availability logic
Upgrade date logic from simple validation to true range booking behavior.

Must do:
- reject end date before start date
- reject overlaps on unavailable statuses
- preserve availability checks in public flow and insertion path
- use a single trustworthy booking-availability rule shared between UI and data layer

Unavailable statuses should include at least:
- approved
- active

If current model uses slightly different names, normalize carefully.

---

## 13. Customer reservation access for Phase 1
Keep “no customer accounts” in spirit.
Do **not** create full customer accounts in Supabase Auth.

Implement lightweight reservation access for Phase 1 using a **generated booking access secret** or similar one-time customer access credential.

### Important
Because identity upload is deferred to Phase 2, do **not** tie login to document number in Phase 1.

### Customer view may show only
- reservation code
- reservation status
- selected motorcycle + image
- rental date range
- payment method
- delivery summary
- contract status
- manager contact CTA
- review CTA once completed

### Customer view must not show
- raw table data
- manager notes
- hidden operational fields
- future Phase 2 identity fields

Implement access via secure RPC / constrained lookup. Public users must not be able to browse bookings.

---

## 14. Contract signing for Phase 1
Add online contract review + signature capture.

Use this contract body:

> MOTORCYCLE RENTAL AGREEMENT
>
> This agreement is made between:
> • Manager: Karen Adrana Espinoza Ruiz
> • Renter: [AUTO-FILL FULL NAME]
>
> 1. Motorcycle Details
> • Make & Model: [AUTO-FILL SELECTED MODEL]
>
> 2. Rental Terms
> • The renter agrees to use the motorcycle responsibly and return it in the same condition as received.
> • Rental Period: From [AUTO-FILL START DATE] to [AUTO-FILL END DATE]
> • Rental Fee: $[AUTO-FILL] (payable in advance)
>
> Payment Options:
> • Venmo (@justina-lydia)
> • PayPal (justinalydiacuddles@gmail.com)
> • Wise (https://wise.com/pay/me/justynaj102)
> • Cash
>
> 3. Liability & Damages
> • The renter is fully responsible for any damage, loss, or theft of the motorcycle during the rental period.
> • In case of damage, the renter agrees to cover the full repair costs.
> • In case of theft or total loss, the renter agrees to compensate the owner with the full market value of the motorcycle.
>
> 4. Insurance & Legal Responsibilities
> • The renter must follow all traffic laws and is responsible for any fines or penalties incurred.
> • The motorcycle is insured until June 11, 2026, but the renter is responsible for any damages not covered by insurance.
>
> 5. Security Deposit
> • A refundable security deposit of $100 is required before rental and will be returned upon the motorcycle’s return in good condition.
>
> 6. Termination & Agreement
> • The owner reserves the right to terminate the rental at any time if the renter violates any terms.
> • By signing this contract, the renter confirms that they have read, understood, and agree to all terms and conditions stated above.
>
> Owner:
> Karen Adrana Espinoza Ruiz
> Signature: __________________________
> Date: _______________________________
>
> Renter:
> Full Name: [AUTO-FILL]
> Signature: [AUTO-FILL SIGNATURE]
> Date: [AUTO-FILL SIGN DATE]

Store:
- typed signature name
- drawn signature
- contract signed timestamp

Provide printable contract view.

---

## 15. Delivery details in Phase 1
Replace vague pickup/dropoff notes with structured delivery fields.

Add to bookings:
- `delivery_date_time`
- `delivery_map_link`
- `delivery_location_description`
- `delivery_status`
- `delivered_at`
- `delivery_note`

Delivery statuses:
- `scheduled`
- `delivered`
- `completed`
- `issue_reported`

Collect during booking.
Show in:
- confirmation page
- customer reservation page
- admin reservation detail
- delivery board

---

## 16. Admin expansion in Phase 1
Retain:
- manager-only Google sign-in through Supabase Auth
- allowed manager email check
- RLS-enforced manager-only access

Expand admin capabilities:
- view all bookings
- approve / reject requests
- mark bookings active / returned / cancelled / completed
- edit manager notes
- view bookings grouped by status and start date
- view earnings in selected range
- view occupancy in selected range
- view payment method breakdown
- view bookings by motorcycle
- access delivery board

---

## 17. Admin delivery board by day in Phase 1
Add a dedicated delivery operations surface.

### Filters
- today
- tomorrow
- next 7 days
- custom date range

### Each delivery row/card shows
- delivery date/time
- customer full name
- customer WhatsApp
- motorcycle
- reservation code
- rental date range
- payment method
- booking status
- delivery status
- map link
- short location description

### Quick actions
- open reservation
- copy WhatsApp number
- open map link
- mark delivered
- mark issue reported

### Dashboard shortcuts
Add:
- shortcut to delivery board
- today’s delivery count
- overdue / incomplete deliveries indicator

---

## 18. Lightweight review flow in Phase 1
Add:
- configurable review link in config
- review CTA for completed reservations in customer view
- admin helper action: `Prepare WhatsApp review reminder`

This helper may:
- open a prefilled `wa.me` link
- or copy a message template

Do not auto-send WhatsApp messages.

---

## 19. Phase 2 deferred features
These are intentionally deferred until after Phase 1 is working.

### 19.1 OCR-assisted identity collection
Later add:
- identity document upload
- OCR extraction of first name / last name / date of birth / document number
- correction UI
- secure storage and access policies

Because there is no custom backend server, likely implementation path is:
- Supabase Edge Function + OCR provider

Do not fake OCR now.

### 19.2 Payment proof upload
Later add:
- optional upload for Venmo / PayPal / Wise
- admin review of proof
- statuses: `not_uploaded`, `uploaded`, `verified`, `rejected`

Do not partially wire upload UI into Phase 1 production paths.

---

## 20. Phase 3 deferred feature
### Extension requests
Later add:
- customer requests later end date
- conflict check
- pending extension request
- admin approve / reject
- price recalculation

Not in Phase 1.

---

## 21. Data model changes for Phase 1

### Update `public.motorcycles`
Keep existing fields and add only:
- `color text`
- `transmission text`

Do **not** add:
- registration numbers
- helmets count
- surf-rack boolean
- delivery-included boolean

### Update `public.bookings`
Retain existing useful fields and add:
- `payment_method text`
- `payment_status text`
- `delivery_date_time timestamptz`
- `delivery_map_link text`
- `delivery_location_description text`
- `delivery_status text`
- `delivered_at timestamptz`
- `delivery_note text`
- `base_price_usd numeric(10,2)`
- `discount_usd numeric(10,2)`
- `rental_total_usd numeric(10,2)`
- `security_deposit_usd numeric(10,2)`
- `total_due_usd numeric(10,2)`
- `rental_days integer`
- `typed_signature_name text`
- `drawn_signature_data text or storage reference`
- `contract_signed_at timestamptz`
- `customer_access_secret_hash text` or equivalent

Do not add Phase 2 / 3 tables yet unless migration sequencing requires placeholders. Avoid dead schema.

---

## 22. RPC / data-layer changes for Phase 1
Replace or expand the existing public booking RPC.

Phase 1 booking creation path must:
- validate active motorcycle
- validate date range
- reject overlaps
- calculate pricing fields
- generate reservation code
- generate customer access secret
- store contract-signing metadata
- insert booking
- return reservation code and customer access instructions

Also add a secure path for:
- customer reservation lookup / login
- delivery-board data retrieval for manager
- admin metrics queries if useful

---

## 23. RLS / security changes for Phase 1
Retain:
- public can read active motorcycles
- manager-only reads/writes for admin
- public cannot broadly read bookings

Add:
- public can create bookings only via approved RPC path
- customer access can reveal only one matching booking via secure lookup path
- manager retains full access by allowed email in JWT

Do not leave any route that allows anonymous booking enumeration.

---

## 24. Pages / entrypoints
This is an existing multi-page Vite app. Extend it rather than rewriting.

Existing:
- `index.html`
- `admin.html`
- `auth-callback.html`

Add in Phase 1:
- `customer.html` for customer reservation access/dashboard
- `contract.html` if a separate print-friendly contract surface is cleaner
- `delivery-board.html` or a clearly separated admin delivery section

---

## 25. README / setup updates
Update README to explain:
- this is an existing-project upgrade
- new motorcycle catalog
- guided booking flow
- pricing logic
- customer reservation access
- contract signing
- delivery board
- review reminder helper
- phased roadmap
- what is deferred and why
- image sourcing rules and any remaining manual asset replacement

Be explicit that these come later:
- OCR-assisted identity collection
- identity document upload
- payment proof upload
- extension requests

---

## 26. Non-goals
Phase 1 does **not** include:
- full customer accounts
- OCR implementation
- identity document upload
- payment proof upload
- extension requests
- custom backend server
- rewrite to Next.js
- overdesigned marketing site

---

## 27. Risks
- Customer reservation access method can be implemented badly if left vague. Hawkeye should specify the exact Phase 1 mechanism.
- Image sourcing can become a copyright trap if random web images are treated as production-ready assets.
- Booking flow can become cluttered if all fields are shown at once.
- Delivery board can become a second admin dashboard if not kept operationally narrow.

---

## 28. Acceptance criteria
### Phase 1 is complete only if:
1. Public site builds and runs locally.
2. The 3 motorcycles shown are Yamaha XT 125, Blue Genesis Click, and Pink Genesis Click.
3. Each motorcycle has an image path wired into the UI, with actual assets or honest placeholders.
4. Public user can complete the guided booking flow.
5. Public user sees live pricing and date-range validation.
6. Availability blocks overlapping unavailable bookings.
7. Manager can sign in with Google.
8. Wrong Google account cannot use admin dashboard.
9. Manager can view and update all bookings.
10. Manager can use the day-grouped delivery board.
11. Customer can access only their own reservation through the Phase 1 access mechanism.
12. Customer view stays low-sensitivity.
13. Contract signing data is stored and printable.
14. GitHub Pages workflow still works.
15. README clearly explains phased roadmap and deferred features.

---

## 29. Final instruction to Concourse
Implement this as a **delta on the existing project**.

Preserve:
- GitHub Pages frontend
- Supabase backend
- Vite + React + TypeScript
- Google login for manager
- automated setup scripts where realistic

Do the work in slices:
- core first
- uploads/OCR/proofs later
- extensions later still

Where a feature is deferred, document it honestly and do not leave fake half-built scaffolding in production paths.
