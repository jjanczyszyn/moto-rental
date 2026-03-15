# CSV Data Audit Report

**Source:** Karen & JJ moto rental - Alquileres.csv
**Audit date:** 2026-03-14
**Total data rows:** 51
**Rows with issues:** 32
**Total issues:** 76
**Errors:** 4
**Warnings:** 25
**Info:** 47

---

## Summary of Issues Found

| Category | Count | Description |
|----------|-------|-------------|
| Date order inverted | 4 | Start date after end date — swapped |
| Year typos | 3 | Years like 2027, 2028, 206 corrected to 2025/2026 |
| Days mismatch | 17 | Stated days ≠ date range |
| Pricing discrepancy | 23 | Total ≠ rate × days |
| Malformed dates | 1 | Double slashes, month/day swaps |

---

## Per-Row Changelog

### Row 2: Lauranodelgado (Genesis Rosa)

| Field | Severity | Issue | Original | Corrected |
|-------|----------|-------|----------|-----------|
| Date order | warning | Start date after end date — swapped | `31/07/2025 → 8/3/25` | `08/03/2025 → 31/07/2025` |
| Días | warning | Stated 3 days but date range = 145 days | `3` | `145` |
| Pricing | info | Total $60 < rate*days $2900 — discount of $2840.00 | `60` | `60` |

### Row 4: Roei taieb (Yamaha)

| Field | Severity | Issue | Original | Corrected |
|-------|----------|-------|----------|-----------|
| Días | warning | Stated 3 days but date range = 92 days | `3` | `92` |
| Pricing | info | Total $60 < rate*days $1840 — discount of $1780.00 | `60` | `60` |

### Row 5: Adam Leshem (Yamaha)

| Field | Severity | Issue | Original | Corrected |
|-------|----------|-------|----------|-----------|
| Fecha inicio | info | Contract override: CSV 03/08/25→8/5/25 ambiguous; contract for Adam Leshem shows 2025-06-28→2025-07-31 but that is a DIFFERENT rental. This row: 2 days at $20=$40 → dates should be 03/08→05/08 (Aug 3-5) | `03/08/25` | `03/08/2025` |
| Fecha fin | info | Contract override: CSV 03/08/25→8/5/25 ambiguous; contract for Adam Leshem shows 2025-06-28→2025-07-31 but that is a DIFFERENT rental. This row: 2 days at $20=$40 → dates should be 03/08→05/08 (Aug 3-5) | `8/5/25` | `05/08/2025` |

### Row 11: John lloyd (Yamaha)

| Field | Severity | Issue | Original | Corrected |
|-------|----------|-------|----------|-----------|
| Fecha inicio | info | Contract override: Contract confirms 2025-06-23; CSV dates 21/6→23/6 are correct (2 days) | `21/6/25` | `21/06/2025` |
| Fecha fin | info | Contract override: Contract confirms 2025-06-23; CSV dates 21/6→23/6 are correct (2 days) | `23/06/25` | `23/06/2025` |

### Row 12: Ezra Yali (Genesis Rosa)

| Field | Severity | Issue | Original | Corrected |
|-------|----------|-------|----------|-----------|
| Pricing | info | Total $100 < rate*days $120 — discount of $20.00 | `100` | `100` |

### Row 14: Shachaf porraz (Genesis Azul)

| Field | Severity | Issue | Original | Corrected |
|-------|----------|-------|----------|-----------|
| Pricing | warning | Total $60 ≠ rate($20)*days(2)=$40 | `60` | `40` |

### Row 15: Shachaf porraz (Genesis Rosa)

| Field | Severity | Issue | Original | Corrected |
|-------|----------|-------|----------|-----------|
| Pricing | warning | Total $60 ≠ rate($20)*days(2)=$40 | `60` | `40` |

### Row 16: Lodwinschlegel (Yamaha)

| Field | Severity | Issue | Original | Corrected |
|-------|----------|-------|----------|-----------|
| Date order | warning | Start date after end date — swapped | `11/10/25 → 26/09/25` | `26/09/2025 → 11/10/2025` |
| Días | warning | Stated 7 days but date range = 15 days | `7` | `15` |
| Pricing | info | Total $129.5 < rate*days $277.5 — discount of $148.00 | `129.5` | `129.5` |

### Row 17: Antony testa (Yamaha)

| Field | Severity | Issue | Original | Corrected |
|-------|----------|-------|----------|-----------|
| Fecha inicio | info | Contract override: Contract shows 2025-05-24 end only; CSV dates 18/5→24/5 confirmed (6 days at $20=$120) | `18/5/25` | `18/05/2025` |
| Fecha fin | info | Contract override: Contract shows 2025-05-24 end only; CSV dates 18/5→24/5 confirmed (6 days at $20=$120) | `24/5/25` | `24/05/2025` |

### Row 19: Ori Soiles (Genesis Azul)

| Field | Severity | Issue | Original | Corrected |
|-------|----------|-------|----------|-----------|
| Fecha inicio | info | Contract override: Contract dates 2025-06-12→2025-06-18 OVERRIDE CSV 16/6→18/6; contract is authoritative (6 days, not 2) | `16/6/25` | `12/06/2025` |
| Fecha fin | info | Contract override: Contract dates 2025-06-12→2025-06-18 OVERRIDE CSV 16/6→18/6; contract is authoritative (6 days, not 2) | `18/6/25` | `18/06/2025` |
| Días | warning | Stated 4 days but date range = 6 days | `4` | `6` |
| Pricing | info | Total $80 < rate*days $120 — discount of $40.00 | `80` | `80` |

### Row 20: fred (Yamaha)

| Field | Severity | Issue | Original | Corrected |
|-------|----------|-------|----------|-----------|
| Días | warning | Stated 5 days but date range = 153 days | `5` | `153` |
| Pricing | info | Total $100 < rate*days $3060 — discount of $2960.00 | `100` | `100` |

### Row 21: Cassandraparis (Genesis Azul)

| Field | Severity | Issue | Original | Corrected |
|-------|----------|-------|----------|-----------|
| Días | warning | Stated 7 days but date range = 11 days | `7` | `11` |
| Pricing | info | Total $100 < rate*days $154 — discount of $54.00 | `100` | `100` |

### Row 22: Madelinehatrick (Genesis Rosa)

| Field | Severity | Issue | Original | Corrected |
|-------|----------|-------|----------|-----------|
| Días | warning | Stated 14 days but date range = 161 days | `14` | `161` |
| Pricing | info | Total $180 < rate*days $2068.85 — discount of $1888.85 | `180` | `180` |

### Row 25: Caleb Lambooy (Genesis Rosa)

| Field | Severity | Issue | Original | Corrected |
|-------|----------|-------|----------|-----------|
| Fecha inicio | info | Contract override: Contract dates 2025-03-24→2025-09-09 look like a long-term rental; CSV 20/7→27/7 (7 days at $13.75=$98) is more plausible for pricing. Keeping CSV. | `20/7/25` | `20/07/2025` |
| Fecha fin | info | Contract override: Contract dates 2025-03-24→2025-09-09 look like a long-term rental; CSV 20/7→27/7 (7 days at $13.75=$98) is more plausible for pricing. Keeping CSV. | `27/7/25` | `27/07/2025` |
| Pricing | warning | Total $98 ≠ rate($13.75)*days(7)=$96.25 | `98` | `96.25` |

### Row 26: Thomas James (Yamaha)

| Field | Severity | Issue | Original | Corrected |
|-------|----------|-------|----------|-----------|
| Días | warning | Stated 5 days but date range = 63 days | `5` | `63` |
| Pricing | info | Total $90 < rate*days $1134 — discount of $1044.00 | `90` | `90` |

### Row 27: Adam Leshem (Yamaha)

| Field | Severity | Issue | Original | Corrected |
|-------|----------|-------|----------|-----------|
| Pricing | info | Total $40 < rate*days $60 — discount of $20.00 | `40` | `40` |

### Row 28: Mike (Yamaha)

| Field | Severity | Issue | Original | Corrected |
|-------|----------|-------|----------|-----------|
| Fecha inicio | info | Contract override: Contract confirms 2025-03-11→2025-07-17 OVERRIDES CSV 7/11/25→17/07/2025; CSV had DD/MM ambiguity on start date | `7/11/25` | `11/03/2025` |
| Fecha fin | info | Contract override: Contract confirms 2025-03-11→2025-07-17 OVERRIDES CSV 7/11/25→17/07/2025; CSV had DD/MM ambiguity on start date | `17/07/2025` | `17/07/2025` |
| Días | warning | Stated 7 days but date range = 128 days | `7` | `128` |
| Pricing | info | Total $120.05 < rate*days $2195.2 — discount of $2075.15 | `120.05` | `120.05` |

### Row 29: Alfa itay (Genesis Rosa)

| Field | Severity | Issue | Original | Corrected |
|-------|----------|-------|----------|-----------|
| Fecha inicio | info | Contract override: CSV 7/9/25→14/07/2025: start "7/9" is ambiguous. Contract match "At OM" shows 2025-07-09→2025-07-13. Using 09/07→14/07 (5 days at $20=$100) | `7/9/25` | `09/07/2025` |
| Fecha fin | info | Contract override: CSV 7/9/25→14/07/2025: start "7/9" is ambiguous. Contract match "At OM" shows 2025-07-09→2025-07-13. Using 09/07→14/07 (5 days at $20=$100) | `14/07/2025` | `14/07/2025` |

### Row 30: Yehouda Tomer (Genesis Azul)

| Field | Severity | Issue | Original | Corrected |
|-------|----------|-------|----------|-----------|
| Fecha inicio | info | Contract override: CSV 7/9/25→13/07/2025: same ambiguity as row 29. "7/9" = July 9, not Sept 7. 4 days at $20=$80 matches. | `7/9/25` | `09/07/2025` |
| Fecha fin | info | Contract override: CSV 7/9/25→13/07/2025: same ambiguity as row 29. "7/9" = July 9, not Sept 7. 4 days at $20=$80 matches. | `13/07/2025` | `13/07/2025` |

### Row 31: Harel yakim (Genesis Rosa)

| Field | Severity | Issue | Original | Corrected |
|-------|----------|-------|----------|-----------|
| Fecha inicio | info | Contract override: CSV 7/2/25→7/5/25: "7/2" = July 2, "7/5" = July 5. 4 days at $20=$80 matches. DD/MM interpretation. | `7/2/25` | `02/07/2025` |
| Fecha fin | info | Contract override: CSV 7/2/25→7/5/25: "7/2" = July 2, "7/5" = July 5. 4 days at $20=$80 matches. DD/MM interpretation. | `7/5/25` | `05/07/2025` |
| Pricing | warning | Total $80 ≠ rate($20)*days(3)=$60 | `80` | `60` |

### Row 32: Fogel yuval (Yamaha)

| Field | Severity | Issue | Original | Corrected |
|-------|----------|-------|----------|-----------|
| Fecha inicio | info | Contract override: CSV 7/2/25→7/7/25: "7/2" = July 2, "7/7" = July 7. 5 days at $20=$100 matches. | `7/2/25` | `02/07/2025` |
| Fecha fin | info | Contract override: CSV 7/2/25→7/7/25: "7/2" = July 2, "7/7" = July 7. 5 days at $20=$100 matches. | `7/7/25` | `07/07/2025` |

### Row 33: Neyman Joseph Aaron (Genesis Azul)

| Field | Severity | Issue | Original | Corrected |
|-------|----------|-------|----------|-----------|
| Fecha inicio | info | Contract override: CSV 7/1/25→3/7/25: "7/1" = July 1. Contract match confirms July range. 2 days at $20=$40 matches. | `7/1/25` | `01/07/2025` |
| Fecha fin | info | Contract override: CSV 7/1/25→3/7/25: "7/1" = July 1. Contract match confirms July range. 2 days at $20=$40 matches. | `3/7/25` | `03/07/2025` |

### Row 34: Jaimelomardia (Yamaha)

| Field | Severity | Issue | Original | Corrected |
|-------|----------|-------|----------|-----------|
| Fecha inicio | info | Contract override: CSV 29/6/25→9/6/25: dates inverted. Start 9/6, end 29/6. But stated 2 days — likely short rental within this range. | `29/6/25` | `09/06/2025` |
| Fecha fin | info | Contract override: CSV 29/6/25→9/6/25: dates inverted. Start 9/6, end 29/6. But stated 2 days — likely short rental within this range. | `9/6/25` | `29/06/2025` |
| Días | warning | Stated 2 days but date range = 20 days | `2` | `20` |
| Pricing | info | Total $40 < rate*days $400 — discount of $360.00 | `40` | `40` |

### Row 35: Vojien ksvarik (Yamaha)

| Field | Severity | Issue | Original | Corrected |
|-------|----------|-------|----------|-----------|
| Fecha inicio | info | Contract override: CSV 31/7/25→17/5/25: dates inverted. Vojien ksvarik, 37 days at $12=$444 via Wise. Long-term rental. | `31/7/25` | `17/05/2025` |
| Fecha fin | info | Contract override: CSV 31/7/25→17/5/25: dates inverted. Vojien ksvarik, 37 days at $12=$444 via Wise. Long-term rental. | `17/5/25` | `31/07/2025` |
| Días | warning | Stated 37 days but date range = 75 days | `37` | `75` |
| Pricing | info | Total $444 < rate*days $900 — discount of $456.00 | `444` | `444` |

### Row 38: Daniel  Karl (Genesis Azul)

| Field | Severity | Issue | Original | Corrected |
|-------|----------|-------|----------|-----------|
| Días | warning | Stated 45 days but date range = 251 days | `45` | `251` |
| Pricing | info | Total $580 < rate*days $3237.9 — discount of $2657.90 | `580` | `580` |

### Row 39: Melanie halo (Genesis Rosa)

| Field | Severity | Issue | Original | Corrected |
|-------|----------|-------|----------|-----------|
| Date order | warning | Start date after end date — swapped | `11/12/25 → 14/11/25` | `14/11/2025 → 11/12/2025` |
| Días | warning | Stated 2 days but date range = 27 days | `2` | `27` |
| Pricing | info | Total $40 < rate*days $540 — discount of $500.00 | `40` | `40` |

### Row 43: Oliver  Matias (Yamaha)

| Field | Severity | Issue | Original | Corrected |
|-------|----------|-------|----------|-----------|
| Fecha fin | error | Year 2028 likely typo | `12/1/28` | `12/01/2026` |
| Días | warning | Stated 3 days but date range = 45 days | `3` | `45` |
| Pricing | info | Total $60 < rate*days $900 — discount of $840.00 | `60` | `60` |

### Row 44: Jessica. Vi (Yamaha)

| Field | Severity | Issue | Original | Corrected |
|-------|----------|-------|----------|-----------|
| Date order | warning | Start date after end date — swapped | `02/12//25 → 12/5/25` | `12/05/2025 → 02/12/2025` |
| Días | warning | Stated 3 days but date range = 204 days | `3` | `204` |
| Pricing | info | Total $60 < rate*days $4080 — discount of $4020.00 | `60` | `60` |
| Fecha inicio | error | Double slash in date | `02/12//25` | `02/12/25` |

### Row 45: Beira  Noam (Genesis Rosa)

| Field | Severity | Issue | Original | Corrected |
|-------|----------|-------|----------|-----------|
| Días | warning | Stated 3 days but date range = 92 days | `3` | `92` |
| Pricing | info | Total $60 < rate*days $1840 — discount of $1780.00 | `60` | `60` |

### Row 50: Yael Tenebom (Genesis Rosa)

| Field | Severity | Issue | Original | Corrected |
|-------|----------|-------|----------|-----------|
| Fecha inicio | info | Contract override: CSV 6/7/25→6/12/25: "6/7"=July 6, "6/12"=Dec 6. Long-term rental, 5 months. Price $100 for 5 days stated — likely a partial record. | `6/7/25` | `06/07/2025` |
| Fecha fin | info | Contract override: CSV 6/7/25→6/12/25: "6/7"=July 6, "6/12"=Dec 6. Long-term rental, 5 months. Price $100 for 5 days stated — likely a partial record. | `6/12/25` | `06/12/2025` |
| Días | warning | Stated 5 days but date range = 153 days | `5` | `153` |
| Pricing | info | Total $100 < rate*days $3060 — discount of $2960.00 | `100` | `100` |

### Row 52: Francoiscorentin (Yamaha)

| Field | Severity | Issue | Original | Corrected |
|-------|----------|-------|----------|-----------|
| Fecha inicio | error | Year 2027 likely typo for 2026 | `10/1/27` | `10/01/2026` |

### Row 53: Gabriel langdeau (Genesis Azul)

| Field | Severity | Issue | Original | Corrected |
|-------|----------|-------|----------|-----------|
| Fecha fin | error | Year 206 is truncated, should be 2026 | `17/01/206` | `17/01/2026` |

---

## Clean Rows (19 rows, no issues)

- Row 3: Roten Shalomo (Yamaha)
- Row 6: Roei taieb (Yamaha)
- Row 7: josef odevik (Yamaha)
- Row 8: Lucy Lewis (Genesis Azul)
- Row 9: Cohen niv (Yamaha)
- Row 10: Sara paton (Genesis Azul)
- Row 13: Ezra Yali (Genesis Azul)
- Row 18: Almog (Genesis Rosa)
- Row 23: Zak (Genesis Azul)
- Row 24: Enrique Zanotta (Yamaha)
- Row 40: Clement.Nicolas (Genesis Rosa)
- Row 41: Jonathan.Cahill (Yamaha)
- Row 42: Larissa Martha (Genesis Rosa)
- Row 46: CARRIE  ANNE (Yamaha)
- Row 47: CARRiE ANNE (Genesis Rosa)
- Row 48: Jana schilling (Yamaha)
- Row 49: Joao Pedro (Yamaha)
- Row 51: Emma Purcell (Genesis Azul)
- Row 54: Francoiscorentin (Yamaha)

---

*Generated by cowgirl-13 | WO-016*