# Failed / Unprocessed Images from Triage

**Date:** 2026-03-14
**Source:** `triage/contracts-unmatched/` deep OCR pipeline

These images could not be fully processed into rental records. Some may contain valid rental data that requires human review.

---

## Category 1: No Extractable Data (36 images)

These images had insufficient dates, amounts, or customer information for automated import. Some are duplicates of successfully processed contracts; others are genuinely unreadable.

### Likely Duplicates of Processed Contracts (identified via EXTRACTED-DATA cross-reference)

| Image | Likely Matches | Notes |
|-------|---------------|-------|
| WhatsApp Image 2025-04-04 at 15.16.02.jpeg | josef odevik (LGC00106) | Same contract, first name obscured by $20 bill |
| WhatsApp Image 2025-04-11 at 08.58.57.jpeg | Vojtech Kovarik (LGC00054) | Contract showing $125/week, Wise payment |
| WhatsApp Image 2025-06-05 at 19.25.06 (1).jpeg | Vojtech Kovarik (LGC00054) | Duplicate of 2025-04-11 contract |
| WhatsApp Image 2025-06-05 at 19.30.09.jpeg | josef odevik (LGC00106) | Different angle of same contract |
| WhatsApp Image 2025-08-06 at 18.30.17.jpeg | Thomas James (LGC00045) | Thomas Jones contract, 5 days at $18/day |
| WhatsApp Image 2025-09-19 at 14.15.25.jpeg | Lodwin Schlegel (LGC00035) | Same contract, $20 bills obscuring terms |
| WhatsApp Image 2025-10-05 at 13.46.55.jpeg | Madeline Hatrick (LGC00015) | Contract showing 05/10 to 19/10 |
| WhatsApp Image 2025-11-12 at 16.03.21.jpeg | Daniel Karl (LGC00055) | Contract showing $580/month |
| WhatsApp Image 2025-11-22 at 12.06.01.jpeg | Luisa Maria Uria (LGC00117) | Contract with rotated image |
| WhatsApp Image 2026-01-08 at 22.17.12.jpeg | Thomas James (LGC00045) | Cleaner copy of Thomas Jones contract |
| WhatsApp Image 2026-01-09 at 17.05.53.jpeg | Fogel Yuval (LGC00111) | Contract for Jan 2026 rental |
| WhatsApp Image 2026-02-05 at 21.40.47.jpeg | Enrique Zanotta (LGC00112) | Contract for Jan 2026 rental |
| WhatsApp Image 2026-02-05 at 21.42.34.jpeg | Cohen Niv (LGC00028) | Duplicate of Jul 2025 contract |
| WhatsApp Image 2026-02-05 at 21.45.23.jpeg | Vojtech Kovarik (LGC00054) | Duplicate of Kovarik contract |
| WhatsApp Image 2026-02-05 at 21.49.18.jpeg | Lodwin Schlegel (LGC00035) | Duplicate of Schlegel contract |
| WhatsApp Image 2026-02-05 at 21.51.06.jpeg | Jana Schilling (LGC00113) | Oct-Nov 2025 contract |
| WhatsApp Image 2026-02-05 at 22.09.39.jpeg | Jonathan Cahill (LGC00058) + Daniel Karl (LGC00055) | Two contracts in one image |
| WhatsApp Image 2026-02-05 at 22.12.19.jpeg | Paris Del Romano / Cassandraparis (LGC00040) | Duplicate of Paris D contract |

### Genuinely Unreadable / Insufficient Data

| Image | What's Visible | Status |
|-------|---------------|--------|
| WhatsApp Image 2025-05-30 at 13.50.09.jpeg | Unknown content | Cannot determine if rental |
| WhatsApp Image 2025-05-30 at 13.50.54.jpeg | Unknown content | Cannot determine if rental |
| WhatsApp Image 2025-06-09 at 22.49.22.jpeg | Unknown content | Cannot determine if rental |
| WhatsApp Image 2025-06-24 at 20.04.42.jpeg | Unknown content | Cannot determine if rental |
| WhatsApp Image 2025-06-29 at 17.11.04.jpeg | Unknown content | Cannot determine if rental |
| WhatsApp Image 2025-06-29 at 17.11.50.jpeg | Unknown content | Cannot determine if rental |
| WhatsApp Image 2025-07-02 at 21.50.05.jpeg | Unknown content | Cannot determine if rental |
| WhatsApp Image 2025-07-03 at 06.23.58.jpeg | Unknown content | Cannot determine if rental |
| WhatsApp Image 2025-08-25 at 14.25.12.jpeg | Unknown content | Cannot determine if rental |
| WhatsApp Image 2025-08-25 at 14.25.12 (1).jpeg | Unknown content (duplicate filename) | Cannot determine if rental |
| WhatsApp Image 2026-01-08 at 22.08.33.jpeg | Unknown content | Cannot determine if rental |
| WhatsApp Image 2026-01-08 at 22.08.48.jpeg | Unknown content | Cannot determine if rental |
| WhatsApp Image 2026-01-10 at 16.32.08.jpeg | Unknown content | Cannot determine if rental |
| WhatsApp Image 2026-02-05 at 21.41.06.jpeg | Unknown content | Cannot determine if rental |
| WhatsApp Image 2026-02-05 at 21.44.56.jpeg | Unknown content | Cannot determine if rental |
| WhatsApp Image 2026-02-05 at 21.45.33.jpeg | Unknown content | Cannot determine if rental |
| WhatsApp Image 2026-02-05 at 21.52.19.jpeg | Unknown content | Cannot determine if rental |
| WhatsApp Image 2026-02-05 at 21.52.31.jpeg | Unknown content | Cannot determine if rental |
| WhatsApp Image 2026-02-05 at 21.53.36.jpeg | Unknown content | Cannot determine if rental |

---

## Category 2: Deep-OCR Garbage (31 images -- all processed but data was wrong)

These images were processed by deep OCR and created records LGC00070-LGC00100, but the extracted data was contract boilerplate, ATM receipts, or other non-rental content. All 31 records have been removed from the final import. The source images remain in `triage/contracts-unmatched/` and `old-contracts/`.

Three of these images (LGC00098, LGC00099, LGC00100) actually contained valid rentals that were correctly re-extracted as new records:
- LGC00098 image -> LGC00114 (Lex Heijnen)
- LGC00099 image -> LGC00115 (Mitchell Baylor)
- LGC00100 image -> LGC00116 (Andrea Hacost)

---

## Summary

| Category | Image Count | Action Needed |
|----------|-------------|---------------|
| Duplicates of processed contracts | 18 | None -- already covered |
| Genuinely unreadable | 18 | Manual human review recommended |
| Deep-OCR garbage (re-extracted) | 3 | Done -- new records created |
| Deep-OCR garbage (no valid data) | 28 | None -- confirmed non-rental |
| **Total unprocessed** | **18** | **Human review needed** |

The 18 genuinely unreadable images should be reviewed by the operator with access to the original WhatsApp conversations for context. Some may be photos of payment receipts, bike photos, or other non-contract images that are not rentals at all.

---

*Generated by cleanup process | 2026-03-14*
