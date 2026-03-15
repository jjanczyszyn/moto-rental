# M14 Design Audit Report

**WO:** WO-20260315-001 Phase 1
**Author:** cowgirl-12
**Date:** 2026-03-15
**Project:** moto-rental
**Spec:** docs/briefs/moto-rental-design-refresh-and-brand-spec.md

---

## 1. Content Duplication Findings

### Critical: Universal Benefits Repeated Twice

The three universal inclusions ("Delivery included", "Surf rack included", "2 helmets included") appear in **two separate locations** on the homepage:

| Location | Render Function | CSS Class | Lines |
|----------|----------------|-----------|-------|
| Hero section | `renderHero()` | `.features-strip` | main-public.ts:41-55 |
| Below motorcycle cards | `renderFeaturesStrip()` | `.features-section` | main-public.ts:57-60 |

Additionally, the hero subtitle (line 46) **hardcodes** the same information in prose: *"Reliable scooter & motorcycle rentals with surf racks, 2 helmets, and delivery included"* — a third repetition.

### Hero + Contact Section Duplication

Both the hero and the contact section render identical WhatsApp and Map buttons. Same links, same purpose, two locations.

### Recommendation per Spec

Per Chief's spec (Section 8): each fact should have **one primary home**. Universal benefits belong in a dedicated benefits strip — not in the hero, not on each card.

---

## 2. Visual Hierarchy Issues

### Heading Level Misuse

| Element | Tag | Size | Issue |
|---------|-----|------|-------|
| Business name in hero | H2 | 2rem / 2.5rem | Should be H1 for the primary page heading |
| Wizard step titles | H2 | 1.5rem | Inconsistent with hero H2 |
| Card names | H3 | 1.125rem | Nearly same size as wizard section headings |
| Feature badges | span | 0.875rem | Too small for key selling points |

### Spacing Inconsistencies

- Hero padding: 3rem 1rem 2rem (desktop) vs 2rem 1rem 1.5rem (mobile)
- Cards: 1.25rem gap in grid, 1rem internal padding
- No consistent spacing scale — values are ad-hoc (1rem, 1.25rem, 1.5rem, 2rem, 3rem)

### Weak Section Separation

No clear visual boundaries between homepage sections. Hero flows directly into cards, cards flow into features strip. Each section needs distinct visual breathing room.

---

## 3. Current Homepage Structure

```
1. Hero — business name + subtitle + features list + WhatsApp/Map links + CTA
2. Motorcycle Cards — 3-column grid (responsive)
3. Features Strip — same 3 inclusions repeated from hero
4. Contact Section — "Get in touch" + WhatsApp/Map buttons (duplicated from hero)
```

### Missing Sections (per Spec)

- **How It Works** — no step-by-step explanation exists
- **Trust / FAQ / Policies** — no FAQ or trust section
- **Dedicated Booking CTA Section** — no final prompt section
- **Proper Footer** — no footer with business info

### Current vs Spec Required Order

| Spec Section | Current State |
|-------------|---------------|
| Hero | Exists but overloaded |
| Universal Benefits | Duplicated, not standalone |
| Motorcycle Selection | Exists, clean |
| How It Works | **Missing** |
| Trust / FAQ | **Missing** |
| Booking CTA Section | **Missing** |
| Footer | **Missing** |

---

## 4. Motorcycle Card Analysis

### Current Card Structure

- Image (180px height, object-fit cover)
- Name (H3, 1.125rem)
- Meta: color + transmission (0.8125rem, #666)
- Rate (1.125rem bold, #2563eb blue)
- No per-card CTA button

### Issues per Spec

- No **one-line use case** or positioning statement
- No **key specs** beyond color/transmission
- No **individual CTA** button per card
- Cards are clean but lack personality — feel utilitarian
- Rate display could be more prominent

### Positive

- Cards do NOT repeat universal benefits (good)
- Consistent layout and hover effects
- Clean responsive grid (1→2→3 columns)

---

## 5. Booking Flow Analysis

### 6-Step Wizard

| Step | Name | Status |
|------|------|--------|
| 1 | Dates | Calendar picker, date range selection |
| 2 | Choose | Motorcycle selection with mini cards |
| 3 | Pricing | Breakdown display (base + discount + deposit) |
| 4 | Details | Customer info + payment + delivery |
| 5 | Contract | Agreement + typed + drawn signatures |
| 6 | Confirm | Success with reservation code |

### Visual Consistency Issues

- Wizard uses same system fonts and blue primary — consistent with homepage
- But wizard has its own spacing patterns separate from homepage
- Step progress bar is well-designed (green checkmarks, blue active, gray upcoming)
- Live summary sidebar is effective but visually disconnected from homepage design

### Step 4 Overload

Step 4 (Details) packs customer info, payment method, AND delivery details into one step. This is the longest and most friction-heavy step.

---

## 6. Image Inventory

### Motorcycle Images

| File | Format | Size | Quality |
|------|--------|------|---------|
| yamaha-xtz-125-white.jpg | JPG | 67.7 KB | Manufacturer product photo |
| genesis-klik-blue.webp | WebP | 55.4 KB | Manufacturer product photo |
| genesis-klik-pink.webp | WebP | 63.3 KB | Manufacturer product photo |

### Issues

- **Format inconsistency**: JPG + WebP mixed — should standardize to WebP
- **Not real-world photos**: All are manufacturer product shots, not lifestyle/rental context
- **Consistent framing**: Reasonably consistent but not styled for premium feel

### Logo/Brand Assets

| File | Format | Size | Status |
|------|--------|------|--------|
| logo.png | PNG | 280 KB | **NOT USED** in rendered HTML — oversized, unused |
| favicon-32.png | PNG | 3.2 KB | OK |
| favicon-16.png | PNG | 2.0 KB | OK |
| apple-touch-icon.png | PNG | 31.3 KB | OK |

---

## 7. Typography Assessment

### Current Font Stack

```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

- No web fonts — pure system fonts
- Fast loading, zero external dependencies
- Professional but generic — no brand distinction

### Font Weights Used

400 (body), 500 (labels), 600 (badges), 700 (headings)

### Spec Gap

Chief spec calls for "refined display or stronger-weight sans-serif for headings" — current system fonts don't provide this distinction. Consider adding one web font for headings only (e.g., Inter, DM Sans, or similar).

---

## 8. Color Palette

| Role | Color | Hex |
|------|-------|-----|
| Primary action | Blue | #2563eb |
| Primary hover | Dark blue | #1d4ed8 |
| Success / WhatsApp | Green | #16a34a |
| Text primary | Near-black | #1a1a1a |
| Text secondary | Gray | #555, #666 |
| Background | Light gray | #fafafa |
| Cards | White | #fff |
| Borders | Light gray | #ccc, #ddd, #e5e7eb |
| Error | Red | #dc2626 |
| Price accent | Purple gradient | #7c3aed |

### Spec Gap

Chief spec calls for "off-white / sand / warm white background" and "deep ocean blue or teal accent." Current #fafafa is cool gray, not warm. Current #2563eb is standard blue, not ocean/teal. Color palette needs warming.

---

## 9. Mobile Responsiveness

### Breakpoints

| Width | Behavior |
|-------|----------|
| < 640px | Single column, stacked layout, full-width buttons |
| 640px+ | 2-column card grid |
| 768px+ | Larger hero heading, wider padding |
| 960px+ | 3-column card grid |

### Mobile Quality

- Layout stacks properly
- Touch targets meet 44px minimum
- Forms are full-width on mobile
- Wizard summary stacks below content on mobile

### Issues

- Hero feels compressed on mobile (padding reduction)
- No mobile-specific design refinements — just collapsed desktop

---

## 10. Logo State

- `logo.png` (280 KB) exists but is **not rendered anywhere** in the HTML
- Header shows text-only: `<h1>Karen & JJ Motorcycle Rental</h1>`
- No SVG version exists
- No brand mark or icon in the header
- Favicon exists but is generic

**Verdict**: Effectively no visual logo on the site. This is a critical gap per Chief's spec.

---

## Summary: Priority Findings

### Must Fix (Phase 2+3)

1. **Remove content duplication** — Universal benefits appear 3x, contact buttons 2x
2. **Add missing sections** — How It Works, Trust/FAQ, Footer, Booking CTA
3. **Create/integrate logo** — Currently no visual brand mark
4. **Warm the color palette** — Shift from cool gray to sand/warm tones, blue to ocean/teal
5. **Establish typography hierarchy** — Consider one heading web font

### Should Fix

6. **Standardize image formats** — All WebP
7. **Add card CTAs and use-case copy** — Per spec requirements
8. **Establish consistent spacing scale** — Replace ad-hoc values
9. **Strengthen section separation** — Visual boundaries between homepage sections
10. **Optimize logo.png** — Currently 280 KB and unused

### Nice to Have

11. Add lifestyle/context imagery (coastal atmosphere)
12. Mobile-specific design refinements beyond layout collapse
13. Step 4 wizard simplification (split delivery into its own step)
