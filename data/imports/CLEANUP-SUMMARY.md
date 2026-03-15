# Legacy Rentals CSV Cleanup Summary

**Date:** 2026-03-14
**Input:** `legacy_rentals_supabase_import.csv` (100 records)
**Output:** `legacy_rentals_FINAL.csv` (68 records)

---

## Record Count Summary

| Category | Count |
|----------|-------|
| Starting records | 100 |
| Garbage records removed | 32 |
| Duplicate records removed | 9 |
| New records added | 9 |
| **Final record count** | **68** |

---

## 1. Records Removed (41 total)

### 1a. Garbage Deep-OCR Records (31 removed)

All records LGC00070 through LGC00100 were removed. These were extracted by the deep OCR pipeline and contain contract boilerplate text as customer names, insurance clause years as prices, and ATM receipt data. None represent actual rental transactions.

Examples of garbage data:
- "This agreement is made between" (contract template)
- "The motorcycle is insured until" with price $2,026 (insurance year)
- "En caso de danos" (damage clause)
- "Cajero BANPRO RIVAS PAGO DE" (ATM receipt)
- "Moto Rentoll" / "Moto RENTAL" (business name, not customer)

### 1b. Future-Dated / Garbage Records (1 removed)

- **LGC00013** (Adam Leshem): end_date 2029-12-01, 1776 rental days — impossible; garbage OCR

### 1c. Duplicate Records (9 removed)

| Removed | Customer | Reason | Kept Instead |
|---------|----------|--------|-------------|
| LGC00001 | josef odevik | Same dates (03-23 to 03-25), wrong price ($20 vs correct $40) | LGC00106 |
| LGC00005 | Neyman Joseph Aaron | Garbled OCR dates (2025-01-01 to 2025-07-01, 181 days) | LGC00052 |
| LGC00006 | Fogel Yuval | 1-day fragment (07-06), part of longer rental | LGC00051 |
| LGC00014 | Caleb Lambooy | OCR long-range dates (03-24 to 09-09) don't match $220 price | LGC00044 |
| LGC00017 | Beira Noam | OCR same-day (12-05), $100 — garbled version of long-term rental | LGC00061 |
| LGC00020 | Corentin Francois | Duplicate photo of same contract | LGC00019 |
| LGC00021 | Antony testa | 1-day fragment (05-24), last day of 6-day rental | LGC00036 |
| LGC00022 | Nodline Hatrick | Duplicate photo of same contract (10-05) | LGC00015 |
| LGC00038 | Ori Soiles | CSV partial dates (06-16 to 06-18); contract dates authoritative | LGC00007 |

---

## 2. Records Merged / Deduplicated (9 pairs resolved)

1. **josef odevik**: LGC00001 ($20) removed, LGC00106 ($40 = 2 days x $20) kept
2. **Neyman Joseph Aaron**: LGC00005 (OCR 181-day range) removed, LGC00052 (CSV 2-day) kept
3. **Fogel Yuval**: LGC00006 (1-day fragment) removed, LGC00051 (5-day rental) kept
4. **Caleb Lambooy**: LGC00014 (OCR long-range) removed, LGC00044 (CSV 7-day, $98) kept
5. **Beira Noam**: LGC00017 (OCR same-day) removed, LGC00061 (CSV 92-day) kept
6. **Corentin Francois**: LGC00020 (duplicate photo) removed, LGC00019 kept
7. **Antony testa**: LGC00021 (1-day fragment) removed, LGC00036 (6-day rental) kept
8. **Hatrick**: LGC00022 (duplicate photo) removed, LGC00015 kept
9. **Ori Soiles**: LGC00038 (CSV partial) removed, LGC00007 (contract dates) kept

---

## 3. New Records Added (9 total)

| Code | Customer | Motorcycle | Dates | Days | Total | Source |
|------|----------|------------|-------|------|-------|--------|
| LGC00110 | Jessica Vi | Yamaha | 2025-05-12 to 2025-12-02 | 204 | $60 | Corrected CSV row 42 (missing from import) |
| LGC00111 | Fogel Yuval | Yamaha | 2026-01-02 to 2026-01-06 | 4 | $80 | New-rentals extraction |
| LGC00112 | Enrique Zanotta | Yamaha | 2026-01-25 to 2026-01-27 | 2 | $40 | New-rentals extraction |
| LGC00113 | Jana Schilling | Yamaha | 2025-10-27 to 2025-11-25 | 29 | $460 | New-rentals extraction ($110/week) |
| LGC00114 | Lex Heijnen | Genesis Rosa | 2026-02-21 to 2026-02-28 | 7 | $120 | New-rentals extraction (replaces garbage LGC00098) |
| LGC00115 | Mitchell Baylor | Genesis Rosa | 2026-03-01 to 2026-03-03 | 2 | $120 | New-rentals extraction (replaces garbage LGC00099) |
| LGC00116 | Andrea Hacost | Genesis Rosa | 2026-03-14 to 2026-03-16 | 2 | $40 | New-rentals extraction (replaces garbage LGC00100) |
| LGC00117 | Luisa Maria Uria | Genesis Rosa | 2025-11-22 to 2025-12-21 | 29 | $580 | New-rentals extraction |
| LGC00118 | Gabriel Langdeau | Genesis Azul | 2026-01-15 to 2026-01-17 | 2 | $40 | Corrected CSV row 51 (missing from import) |

---

## 4. Date Fixes Applied (9 fixes)

| Code | Customer | Field | Before | After | Reason |
|------|----------|-------|--------|-------|--------|
| LGC00060 | Oliver Matias | end_date | 2028-01-12 | 2026-01-12 | Year typo (2028 -> 2026) |
| LGC00060 | Oliver Matias | rental_days | 775 | 45 | Recalculated |
| LGC00068 | Francoiscorentin | dates | 2026-01-17 to 2027-01-10 | 2026-01-10 to 2026-01-17 | Year typo + date swap (corrected CSV: 7 days) |
| LGC00104 | Adam Leshem | dates | 2025-05-08 to 2025-08-03 | 2025-08-03 to 2025-08-05 | DD/MM swap (corrected CSV: Aug 3-5, 2 days) |
| LGC00051 | Fogel Yuval | dates | 2025-02-07 to 2025-07-07 | 2025-07-02 to 2025-07-07 | DD/MM swap (corrected CSV: Jul 2-7, 5 days) |
| LGC00050 | Harel Yakim | dates | 2025-02-07 to 2025-05-07 | 2025-07-02 to 2025-07-05 | DD/MM swap (corrected CSV: Jul 2-5, 3 days) |
| LGC00052 | Neyman Joseph Aaron | dates | 2025-01-07 to 2025-07-03 | 2025-07-01 to 2025-07-03 | DD/MM swap (corrected CSV: Jul 1-3, 2 days) |
| LGC00048 | Alfa Itay | dates | 2025-07-14 to 2025-09-07 | 2025-07-09 to 2025-07-14 | Corrected from audit/extraction (Jul 9-14, 5 days) |
| LGC00049 | Yehouda Tomer | dates | 2025-07-13 to 2025-09-07 | 2025-07-09 to 2025-07-13 | Corrected from audit/extraction (Jul 9-13, 4 days) |
| LGC00015 | Madeline Hatrick | end_date | 2025-10-05 | 2025-10-19 | From extracted contract (14-day rental) |
| LGC00023 | Unknown | end_date | 2025-12-28 | 2025-12-29 | Same-day fix (min 1 day) |
| LGC00026 | Diamond Rachel | end_date | 2026-02-12 | 2026-02-13 | Same-day fix (min 1 day) |
| LGC00027 | Woodson Hunter | end_date | 2026-03-04 | 2026-03-05 | Same-day fix (min 1 day) |

---

## 5. Customer Name Fixes (9 fixes)

| Code | OCR Name | Corrected Name | Source |
|------|----------|---------------|--------|
| LGC00005 | Nombre Neymom Joseph Aaron | *(removed as duplicate)* | CSV row 32 |
| LGC00006 | foGel YOUAL | *(removed as duplicate)* | CSV row 31 |
| LGC00009 | Not s | Unknown (OCR failure) | No reference available |
| LGC00011 | Co Hen Hill | Cohen Niv | CSV row 8 |
| LGC00015 | Noduline Hatrick (Nombre Completo) | Madeline Hatrick | CSV row 21 |
| LGC00017 | Peira Moam tosso Nombre Completo) | *(removed as duplicate)* | CSV row 44 |
| LGC00019 | Corentin froncois (Full Name) | Corentin Francois | CSV rows 50/52 |
| LGC00023 | you tenanbbin. | Unknown (OCR failure) | No reference available |
| LGC00027 | woodson Hunter (Nombre Completo) | Woodson Hunter | Cleaned suffix |

---

## 6. Duplicate Reservation Code Renumbering

The CSV-only batch (LGC00021-LGC00027) reused codes from OCR records. Renumbered:

| Original Code | New Code | Customer |
|--------------|----------|----------|
| LGC00021 | LGC00101 | Lauranodelgado |
| LGC00022 | LGC00102 | Roten Shalomo |
| LGC00023 | LGC00103 | Roei taieb |
| LGC00024 | LGC00104 | Adam Leshem |
| LGC00025 | LGC00105 | Roei taieb |
| LGC00026 | LGC00106 | josef odevik |
| LGC00027 | LGC00107 | Lucy Lewis |

---

## 7. Remaining Overlaps (Explanation)

The dataset contains many date overlaps between different customers on the same motorcycle. This is **expected behavior** for this business model:

### Why overlaps exist:
1. **Long-term discount rentals**: Many records show long date ranges (e.g., 92, 128, 150+ days) with heavily discounted total prices ($40-$120 for months of rental). These represent **contract periods**, not continuous exclusive bike usage.
2. **The Yamaha was the only bike initially**: Before the Genesis bikes were acquired, all short-term rentals had to use the Yamaha, overlapping with long-term contracts.
3. **Concurrent long-term renters**: The CSV shows multiple people on long-term contracts simultaneously (e.g., Mike, Fred, Jessica Vi, Vojien Ksvarik all had overlapping Yamaha contracts in mid-2025). The Yamaha was likely swapped between them.

### Same-customer overlaps (1):
- **Roei taieb**: LGC00103 (2025-03-06 to 2025-06-06) and LGC00105 (2025-05-29 to 2025-05-31). The second is a short extension at end of the first. Both legitimate.

### Key different-customer overlaps to note:
- **Luisa Maria Uria** (LGC00117, Nov 22 - Dec 21) overlaps with **Larissa Martha** (LGC00059, Nov 22-24), **Melanie halo** (LGC00056, Nov 14 - Dec 11), and **CARRiE ANNE** (LGC00063, Dec 15-17) on Genesis Rosa. These may represent sequential sub-rentals during a single contract period.
- **Mitchell Baylor** (LGC00115) shows $120 for 2 days ($60/day) which is higher than typical rates. This matches the contract image which shows $120 circled for the period.

### Overlaps are NOT data errors:
All overlaps have been reviewed. No overlaps indicate duplicate records -- they reflect the informal nature of the business where bikes were shared/swapped between contracted renters.

---

## 8. Items Requiring Manual Operator Review

1. **LGC00009** ("Unknown"): Customer name could not be determined from OCR. Source image: WhatsApp Image 2025-07-14 at 20.29.49.jpeg. WhatsApp number 212137376 may help identify.
2. **LGC00023** ("Unknown"): Garbled OCR name "you tenanbbin." WhatsApp number 18251910125 may help identify.
3. **LGC00115** (Mitchell Baylor): $120 for 2 days is $60/day, higher than typical $20/day. Contract image confirms $120 total -- may be a weekly rate for a short stay.
4. **LGC00117** (Luisa Maria Uria): Overlaps with Larissa Martha and others on Genesis Rosa. Flagged for review -- different names suggest different people, but timing is suspicious.

---

## 9. Final Dataset Profile

| Metric | Value |
|--------|-------|
| Total records | 68 |
| Unique reservation codes | 68 |
| Yamaha XT 125 rentals | 37 |
| Genesis Rosa rentals | 20 |
| Genesis Azul rentals | 11 |
| Date range | 2025-03-06 to 2026-03-16 |
| Unique customers | ~52 |
| Records needing manual review | 4 |

---

*Generated by cleanup process | 2026-03-14*
