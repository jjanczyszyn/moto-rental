# FINAL REVIEW: Legacy OCR Backfill Import

**Reviewer:** Claude (final QA pass)
**Date:** 2026-03-14
**Verdict:** DO NOT IMPORT AS-IS. Critical issues found.

---

## Executive Summary

The import CSV (`legacy_rentals_supabase_import.csv`) contains **100 rows**, but only **~67 are legitimate rental records**. The remaining **~33 are garbage** produced by the deep OCR pipeline (LGC00070-LGC00100) that extracted contract boilerplate text as customer names, years as prices, and same-day date ranges. Additionally, there are **5 duplicate reservation codes**, **3 records with future end dates** (2027, 2028, 2029), and **7 genuinely new rentals** from the new-rentals triage that need to be added.

**The file needs significant cleanup before import.**

---

## 1. CRITICAL: 31 Garbage Deep-OCR Records (MUST REMOVE)

Records LGC00070 through LGC00100 are almost entirely garbage. The deep OCR pipeline extracted contract template text as customer names and insurance expiry years as prices. These are NOT rental records.

**Examples of garbage data being imported:**

| Code | "Customer Name" | "Price" | Issue |
|------|----------------|---------|-------|
| LGC00070 | "This agreement is made between" | $125 | Contract boilerplate |
| LGC00071 | "The motorcycle is insured until" | $2,026 | Insurance clause; year = price |
| LGC00076 | "En caso de danos" | $2,026 | Damage clause text |
| LGC00081 | "Cajero BANPRO RIVAS PAGO DE" | $2,025 | ATM receipt, not a rental |
| LGC00082 | "Quenta des" | $2,025 | ATM receipt |
| LGC00083 | "Bajero No" | $2,025 | ATM receipt |
| LGC00092 | "Thetalles de la Motociclet PB" | $3,100 | Contract heading |
| LGC00100 | "Steven T" | $2,026 | Actually Andrea Hacost (per new-rentals extraction) |

**Action:** Remove all 31 records (LGC00070-LGC00100) from the import CSV. Three of these (LGC00098, LGC00099, LGC00100) correspond to real rentals that should be re-created with correct data from the new-rentals EXTRACTED-DATA.csv (Lex Heijnen, Mitchell Baylor, Andrea Hacost).

---

## 2. CRITICAL: 5 Duplicate Reservation Codes

The CSV-only import (LGC00021-LGC00027) reused reservation codes already assigned to OCR-matched records. Supabase will reject these if reservation_code has a unique constraint.

| Code | Record 1 | Record 2 |
|------|----------|----------|
| LGC00021 | Antony testa (OCR, 2025-05-24) | Lauranodelgado (CSV, 2025-03-08) |
| LGC00022 | Nodline Hatrick (OCR, 2025-10-05) | Roten Shalomo (CSV, 2025-06-29) |
| LGC00023 | you tenanbbin. (OCR, 2025-12-28) | Roei taieb (CSV, 2025-03-06) |
| LGC00026 | Diamond Rachel (OCR, 2026-02-12) | josef odevik (CSV, 2025-03-23) |
| LGC00027 | woodson Hunter (OCR, 2026-03-04) | Lucy Lewis (CSV, 2025-06-22) |

**Action:** Renumber the CSV-only batch. The OCR records (first column) should also be reviewed -- "Nodline Hatrick", "you tenanbbin.", "woodson Hunter" are garbage OCR names. The CSV-only records (second column) are the legitimate ones.

---

## 3. CRITICAL: Records with Absurd Dates

| Code | Customer | Start | End | Issue |
|------|----------|-------|-----|-------|
| LGC00013 | Adam Leshem | 2025-01-20 | **2029-12-01** | End date 4 years out; 1,776 rental days |
| LGC00060 | Oliver Matias | 2025-11-28 | **2028-01-12** | End date 2 years out; 775 rental days |
| LGC00068 | Francoiscorentin | 2026-01-17 | **2027-01-10** | Year typo (should be 2026); audit caught this but fix not applied |

**Action:** LGC00013 is clearly bad OCR -- remove or fix. LGC00060 end date should be 2026-01-12 (from audit report). LGC00068 end date should be 2026-01-17 to 2026-01-19 or similar (the audit found the year 2027 is a typo for 2026, but the corrected CSV date was not propagated to import).

---

## 4. Duplicate Rental Records (Same Customer, Overlapping Dates)

These are records where the same person appears multiple times with overlapping date ranges on the same motorcycle, suggesting duplicate data entry:

| Customer | Record 1 | Record 2 | Assessment |
|----------|----------|----------|------------|
| **josef odevik** | LGC00001 (2025-03-23 to 03-25, $20) | LGC00026 (same dates, $40) | DUPLICATE -- same rental, different prices. Keep LGC00026 ($40 = 2 days x $20), remove LGC00001 |
| **Antony testa** | LGC00021 (2025-05-24, $20, 1 day) | LGC00036 (2025-05-18 to 05-24, $120, 6 days) | LGC00021 is the last day of LGC00036. REMOVE LGC00021 |
| **Ori Soiles** | LGC00007 (06-12 to 06-18, $40) | LGC00038 (06-16 to 06-18, $80) | Same rental, different date ranges. LGC00007 uses contract dates (authoritative). REMOVE LGC00038 or reconcile |
| **Adam Leshem** | LGC00012 (06-28 to 07-31, $20) | LGC00013 (01-20 to 2029-12-01, $20) | LGC00013 is garbage OCR. REMOVE LGC00013 |
| **Adam Leshem** | LGC00012 (06-28 to 07-31) | LGC00024 (05-08 to 08-03) | Different representations of the same or overlapping rental. LGC00024 dates are from the corrected CSV. NEEDS MANUAL REVIEW |
| **Caleb Lambooy** | LGC00014 (03-24 to 09-09, $220) | LGC00044 (07-20 to 07-27, $98) | LGC00014 is OCR dates (long range); LGC00044 is CSV dates (7 days). These may be the same rental -- audit noted the conflict. NEEDS MANUAL REVIEW |
| **Corentin francois** | LGC00019 (08-10 to 2026-01-14, $120) | LGC00020 (01-10 to 2026-01-14, $120) | Two OCR records from adjacent photos. Likely the SAME rental photographed twice. REMOVE one |
| **Noduline/Nodline Hatrick** | LGC00015 (same-day, $180) | LGC00022 (same-day, $180) | Same contract photographed twice. REMOVE LGC00022 |
| **Shachaf porraz** | LGC00033 (06-19 to 06-21, Genesis Azul) | LGC00034 (06-19 to 06-21, Genesis Rosa) | Same dates, different bikes -- this is LEGITIMATE (rented 2 bikes simultaneously) |

---

## 5. Customer Name Issues (26 records)

Beyond the 31 garbage deep-OCR records, several OCR-matched records have garbled names:

| Code | OCR Name | Likely Correct Name | Source |
|------|----------|-------------------|--------|
| LGC00005 | Nombre Neymom Joseph Aaron | Neyman Joseph Aaron | CSV row 32 |
| LGC00006 | foGel YOUAL | Fogel Yuval | CSV row 31 |
| LGC00009 | Not s | UNKNOWN | OCR failure |
| LGC00011 | Co Hen Hill | Cohen Niv | CSV row 8 |
| LGC00015 | Noduline Hatrick (Nombre Completo) | Madeline Hatrick | CSV row 21 |
| LGC00017 | Peira Moam tosso Nombre Completo) | Beira Noam | CSV row 44 |
| LGC00023 | you tenanbbin. | UNKNOWN | OCR failure |

**Action:** Fix names using CSV as reference. Records with "(Nombre Completo)" appended should have that removed.

---

## 6. New Rentals NOT in Import (MUST ADD)

The new-rentals EXTRACTED-DATA.csv identified these rentals that have NO corresponding record in the import CSV:

| # | Customer | Dates | Price | Motorcycle | Notes |
|---|----------|-------|-------|------------|-------|
| 1 | **Fogel Yuval** | 2026-01-02 to 2026-01-06 | $20/day ($80) | Yamaha XT 125 | Completely new, not in CSV |
| 2 | **Enrique Zanotta** | 2026-01-25 to 2026-01-27 | $20/day ($40) | Yamaha XT 125 | Second rental (first was Aug 2025) |
| 3 | **Jana Schilling** | 2025-10-27 to 2025-11-25 | $110/week | Yamaha XTZ 125 | Different rental from Dec 2025 one |
| 4 | **Lex Heijnen** | 2026-02-21 to 2026-02-28 | $120 | Genesis Rosa | New customer. Replaces garbage LGC00098 |
| 5 | **Mitchell Baylor** | 2026-03-01 to 2026-03-03 | $120 | Genesis Rosa | New customer. Replaces garbage LGC00099 |
| 6 | **Andrea Hacost** | 2026-03-14 to 2026-03-16 | $40 | Genesis Rosa | New customer. Replaces garbage LGC00100 |
| 7 | **Luisa Maria Uria** | 2025-11-22 to ~2025-12-21 | $20/day | Genesis Rosa | NEEDS REVIEW -- could be same as "Larissa Martha" LGC00059 |

**Also possibly missing:** Thomas Jones (separate 5-day rental at $18/day Aug 6-10) may be distinct from "Thomas James" (63-day rental Jun 8 - Aug 10). The new-rentals extraction shows a short rental at $18/day vs the CSV's long-term at $18/day. If the CSV dates are correct (63 days, Jun-Aug), then Thomas Jones is already covered. But if the CSV dates are wrong and it was really 5 days, the record needs fixing.

---

## 7. Image Accounting

| Location | Image Count | Status |
|----------|-------------|--------|
| old-contracts/ (originals) | 103 | All images remain here |
| triage/new-rentals/ | 27 | Human-extracted new data |
| triage/matched-resolved/ | 23 | Matched to CSV rows |
| triage/owner-receipts/ | 3 | Not rentals (owner deposit records) |
| triage/contracts-unmatched/ | 72 | Includes copies from other triage folders |

**Key findings:**
- All 103 original images remain in `old-contracts/` (triage used copies, not moves)
- 53 images exist in BOTH `contracts-unmatched/` AND another triage folder (double-counted)
- 31 images in `old-contracts/` are NOT in any triage folder, but all 31 ARE referenced as source files in the import/review CSVs (these were the first-pass OCR matches)
- 9 matched-resolved images are NOT referenced in the import source files (may be secondary photos of already-imported contracts)
- **No images are unaccounted for.** Every image is either in a triage folder, referenced in the import, or both.

---

## 8. Import CSV Validation Summary

| Check | Result | Severity |
|-------|--------|----------|
| Total rows | 100 | -- |
| Legitimate records | ~67 | -- |
| Garbage deep-OCR records | 31 | CRITICAL -- remove |
| Duplicate reservation codes | 5 (10 rows affected) | CRITICAL -- renumber |
| Future end dates (>2026) | 3 | CRITICAL -- fix |
| Same-day rentals (start=end) | 27 (all garbage OCR) | Part of garbage removal |
| Overlapping date duplicates | 8 pairs | HIGH -- deduplicate |
| Garbled customer names | 7 (non-garbage) | MEDIUM -- fix |
| Prices > $1000 | 19 (all garbage OCR) | Part of garbage removal |
| All motorcycle_id UUIDs valid | YES | OK |
| All dates parseable | YES | OK |
| 3 unique motorcycle IDs | YES (Yamaha, Genesis Rosa, Genesis Azul) | OK |

---

## 9. Recommended Next Steps

### Step 1: Remove the 31 garbage records (LGC00070-LGC00100)
These are contract boilerplate, ATM receipts, and insurance clauses -- not rental records.

### Step 2: Fix the 5 duplicate reservation codes
Renumber CSV-only records LGC00021-LGC00027 to start at LGC00101 (or whatever the next available code is).

### Step 3: Remove true duplicate rentals
- Remove LGC00001 (josef odevik duplicate of LGC00026)
- Remove LGC00013 (Adam Leshem garbage OCR with 2029 end date)
- Remove LGC00015 OR LGC00022 (Hatrick duplicate)
- Remove LGC00021 (Antony testa last-day fragment, LGC00036 is complete)
- Remove LGC00019 OR LGC00020 (Corentin francois duplicate photo)

### Step 4: Fix dates
- LGC00060 Oliver Matias: change end_date to 2026-01-12
- LGC00068 Francoiscorentin: change end_date to match corrected CSV

### Step 5: Fix customer names
- LGC00005: "Nombre Neymom Joseph Aaron" -> "Neyman Joseph Aaron"
- LGC00006: "foGel YOUAL" -> "Fogel Yuval"
- LGC00011: "Co Hen Hill" -> "Cohen Niv"
- LGC00017: "Peira Moam tosso..." -> "Beira Noam"
- Remove "(Nombre Completo)" and "(Full Name)" from all names

### Step 6: Add 6 confirmed new rentals
Create new records for Fogel Yuval (Jan 2026), Enrique Zanotta (Jan 2026), Jana Schilling (Oct-Nov 2025), Lex Heijnen (Feb 2026), Mitchell Baylor (Mar 2026), Andrea Hacost (Mar 2026).

### Step 7: Manual review needed
- LGC00009 "Not s" -- open source image, determine customer name
- LGC00024 vs LGC00012 (Adam Leshem) -- which dates are correct?
- LGC00014 vs LGC00044 (Caleb Lambooy) -- which dates are correct?
- Luisa Maria Uria vs Larissa Martha -- same person or different?
- Thomas James dates -- is it really 63 days or should it be 5?

### Step 8: After cleanup, the import should contain approximately:
- 67 legitimate records (from current 100 minus 31 garbage minus ~5 duplicates)
- Plus 6 new records from new-rentals extraction
- **Target: ~73 clean records ready for Supabase import**

---

## Appendix: Records by Source

| Source | Count | Quality |
|--------|-------|---------|
| CSV-only (no photo) | 49 | Generally good after audit corrections |
| OCR-matched (photo + CSV) | 20 | Good, some name cleanup needed |
| Deep OCR (LGC00070-LGC00100) | 31 | Almost entirely garbage -- REMOVE |
| New-rentals (human extraction) | 6 to add | High quality |

---

*Generated by final QA review | 2026-03-14*
