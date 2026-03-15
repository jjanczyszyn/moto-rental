# Chief > Operator · Project: MOTO-RENTAL · Focus: Legacy contract OCR backfill

Step 1/1 · Next: Hand this artifact to Foreman/Hawkeye to bind exact schema column names from the current repo and implement the backfill pipeline.

---

# BUILD BRIEF + TECH SPEC: Legacy Contract OCR Backfill for Historical Rentals
Project: MOTO-RENTAL  
Author: Chief  
Date: 2026-03-14  
Status: Draft  
Reference: Chief Initialization Pack v3

## What We're Building
A one-off but repeatable backfill pipeline that reads contract images from `data/old-contracts`, performs OCR and structured extraction, reconciles customer names against `Karen & JJ moto rental - Alquileres.csv`, normalizes dates from the contracts, deduplicates repeated contract photos, and outputs a Supabase-importable file aligned to the **existing rental schema already present in this project**.

This is **not** a customer-facing feature. It is an operator/admin data migration utility whose job is to convert messy historical contract artifacts into clean legacy rental rows with an audit trail and confidence markers.

## Why
Historical rentals currently live in photos and a partially-correct CSV. That makes reporting, operational memory, customer lookup, and historical availability integrity weak. The correct move is not manual retyping. The correct move is a deterministic import pipeline that is conservative on hard requirements, explicit about uncertainty, and leaves behind a clean work queue for any contracts still needing human review.

## Constraints
- Must use the **existing project schema** as the destination contract. Do not invent a parallel schema.
- Source images live in `data/old-contracts`.
- Source CSV lives in the same folder and is named `Karen & JJ moto rental - Alquileres.csv`.
- CSV is the **source of truth for names**, but **not** for dates.
- Contract dates are the authoritative date source when readable.
- Contract date formats are `DD/MM/YYYY` or `DD/MM/YY`.
- There are duplicate photos of the same contract.
- If **name + dates** match, only one data record must be created.
- Successfully processed source files must be moved out of `data/old-contracts` so unresolved work is obvious.
- Must mark uncertainty and preserve provenance.
- Must be rerunnable without creating duplicate imports.

## Quality Bar
- Import output is directly usable for Supabase CSV import with exact header names matching the current schema target.
- Name reconciliation favors CSV names whenever a contract-to-CSV match is credible.
- Date normalization is deterministic and contract-first.
- Duplicate contract photos do not create duplicate rental rows.
- Every imported row can be traced back to one or more source files.
- Low-confidence or incomplete cases are surfaced for review instead of silently guessed past the point of safety.
- After a successful run, `data/old-contracts` contains only unresolved files.

## Scope
### In
- OCR of legacy contract images
- Structured field extraction from OCR text
- CSV reconciliation for canonical customer names
- Date normalization and validation
- Record-level deduplication
- Import CSV generation for Supabase
- Review report generation for uncertain rows and non-importable cases
- Source file movement for successfully processed contracts and duplicates
- Deterministic rerun behavior

### Out (Non-goals)
- No admin UI for this workflow
- No live OCR inside the production booking flow
- No schema redesign unless absolutely required to map into the current schema
- No rewriting of historical business rules beyond what is required to fit the current model
- No manual data entry tool

---

## Assumptions
1. The repo already contains a Supabase schema and migrations for the rental domain.
2. There is a single authoritative target table for historical rentals, or a clear approved table the team can map to without ambiguity.
3. Historical rentals should land in the same logical model as current rentals/bookings unless the existing schema already distinguishes request vs approved rental vs completed rental.
4. The CSV contains at least some combination of customer names and rental metadata that makes reconciliation materially better than OCR-only extraction.
5. Older rentals are modern-era records, so two-digit years should normally resolve to 20xx unless validation says otherwise.

If any of these assumptions fail, Foreman/Hawkeye must log an ADR before build.

---

## Operator Outcome
At the end of this work, the repo should be able to produce:

1. `data/imports/legacy_rentals_supabase_import.csv`  
   Exact Supabase-importable CSV matching the current schema.

2. `data/imports/legacy_rentals_review.csv`  
   Sidecar review file listing uncertain fields, guesses, confidence, non-importable rows, duplicate groups, and provenance.

3. `data/imports/legacy_rentals_manifest.json`  
   Machine-readable manifest summarizing counts, processed files, duplicates, skipped files, and import stats.

4. Moved source files:
   - `data/processed-contracts/success/`
   - `data/processed-contracts/duplicates/`

After a clean run, `data/old-contracts/` should contain only files still needing attention.

---

# PRD: Legacy Contract OCR Backfill

## 1. Problem
The business has historical rental contracts in image form and an already-extracted CSV that is useful but imperfect. Manual entry is slow and error-prone. OCR alone is not enough because names can be cleaner in the CSV and dates can be cleaner in the contracts. The system needs a reliable reconciliation pipeline.

## 2. Target User / JTBD
**Operator / Manager JTBD:** “Take a folder of old contract photos plus a messy historical CSV and turn it into one trustworthy import file for Supabase without manually re-entering every contract.”

## 3. Goals
- Produce a clean import CSV mapped to the existing schema
- Keep only one row per real rental even when there are duplicate photos
- Prefer canonical names from the historical CSV
- Prefer dates from the contracts
- Make unresolved or uncertain cases obvious and reviewable
- Preserve auditability from imported row back to source files

## 4. Non-Goals
- Building a generalized document processing platform
- Auto-fixing every ambiguous legacy record with zero review
- Changing current booking UX or auth flow

## 5. User Flow
1. Operator places raw contract images in `data/old-contracts/` and ensures `Karen & JJ moto rental - Alquileres.csv` is present.
2. Operator runs the backfill CLI.
3. Tool inventories images and reads the CSV.
4. Tool OCRs each image, extracts candidate rental fields, and scores confidence.
5. Tool reconciles names against the CSV and normalizes dates from contract text.
6. Tool groups duplicate/near-duplicate contract photos into a single logical rental.
7. Tool emits import CSV, review CSV, and manifest.
8. Tool moves successful and duplicate-resolved source files out of `data/old-contracts`.
9. Operator imports the output CSV into Supabase.
10. Operator manually resolves any remaining rows/files surfaced in `legacy_rentals_review.csv`.

---

## 6. Requirements

### 6.1 Functional Requirements

#### FR-1: Existing schema binding
Before any extraction logic is finalized, the implementation must inspect the current repo schema and bind to the exact destination table and exact column names already used by the project.

**Rules:**
- Do not define new business columns just because they would be convenient.
- If extra provenance/confidence data does not fit the current schema, store it in sidecar artifacts, not in the destination import CSV.
- If the existing schema requires enum/status values, use only values already present in the schema or migrations.

#### FR-2: Input discovery
The pipeline must scan `data/old-contracts/` for supported image types at minimum: `.jpg`, `.jpeg`, `.png`, `.webp`, optionally `.pdf` if present.

The tool must ignore:
- hidden files
- the source CSV itself
- already-generated artifacts
- files already moved out of the input directory

#### FR-3: OCR extraction
For each source image, the pipeline must perform OCR and extract raw text plus structured candidate fields relevant to the current rental schema.

At minimum, attempt extraction for these conceptual fields when present on the contract:
- customer full name
- phone number
- email
- motorcycle / vehicle identifier or model
- rental start date
- rental end date
- rental duration if explicitly written
- total price / rate
- deposit amount
- payment status if present
- pickup / dropoff location if present
- contract number if present
- notes or free text that may help matching

**Implementation guidance:**
- Prefer a stable OCR provider that performs well on photographed Spanish-language forms.
- The extraction layer should separate:
  1. raw OCR text
  2. normalized candidate fields
  3. confidence per field
- If a second-pass parser is needed, keep it deterministic where possible and log the decision path.

#### FR-4: Name reconciliation using CSV as source of truth
Customer names in the final output must prefer the CSV whenever a credible match between contract and CSV row is found.

**Rules:**
- Contract OCR name is the matching hint, not the final truth, when a CSV match exists.
- CSV dates must not override readable contract dates.
- Reconciliation should use multiple signals where available: OCR name tokens, phone, vehicle/model, price, contract number, and nearby dates.
- If multiple CSV rows plausibly match one contract, choose the best-scoring row and mark the ambiguity in the review file.
- If no credible CSV match exists, use the best OCR-derived name and mark `name_source = ocr` in the review artifact.

#### FR-5: Date normalization and validation
Dates must be parsed from contract text using accepted formats:
- `DD/MM/YYYY`
- `DD/MM/YY`

**Rules:**
- Contract-derived dates are authoritative whenever readable.
- Two-digit years should resolve to 20xx by default.
- If a two-digit year parse would create an impossible or clearly invalid result, flag it for review.
- If start and end are reversed but the contract clearly indicates a range, correct the ordering and log the correction.
- If only one date is found and the schema requires two, try to infer the second only when duration is explicitly present; otherwise surface for review.
- Never trust CSV date values over clear contract dates.

#### FR-6: Deduplication
The system must deduplicate repeated photos of the same contract and repeated logical rental records.

**Primary dedupe rule required by operator:**
If normalized **customer name + rental start date + rental end date** are the same, create only one destination record.

**Additional implementation guidance:**
- Maintain a file-level grouping so multiple images contributing to the same record are all traced.
- Prefer the highest-confidence field value across duplicate candidates.
- If duplicate candidates disagree on a non-key field, keep the highest-confidence value and log the conflict in the review CSV.
- Duplicate-resolved extra source files should move to `data/processed-contracts/duplicates/`.

#### FR-7: Import CSV generation
The pipeline must generate a CSV import file whose header exactly matches the target Supabase table import format.

**Rules:**
- One row per deduplicated logical rental.
- Use the exact column names and enum values already defined in the current project schema.
- Populate all fields that can be mapped with confidence.
- For nullable fields, leave blank when unknown.
- Do not invent IDs if Supabase can generate them.
- If the destination schema requires fields not recoverable from legacy data, either:
  - fill them via existing safe defaults already used by the schema, or
  - exclude the row and surface it in the review CSV.

#### FR-8: Review artifact generation
The pipeline must generate a review artifact for transparency and manual cleanup.

`legacy_rentals_review.csv` must include, at minimum:
- source file name(s)
- dedupe group id
- candidate customer name
- final customer name
- name source (`csv` or `ocr`)
- parsed start date
- parsed end date
- uncertain fields list
- confidence score per important field
- reason flagged
- importable (`yes/no`)
- guessed corrections applied
- notes

#### FR-9: Source file movement
Once a contract is successfully represented by an import row, all associated source files must be moved out of `data/old-contracts`.

**Directory behavior:**
- Successfully represented files move to `data/processed-contracts/success/`
- Redundant duplicate files move to `data/processed-contracts/duplicates/`
- Files not successfully represented remain in `data/old-contracts/`

**Safety rules:**
- Preserve original filenames where possible.
- Never delete originals before output artifacts are written successfully.
- Move only after successful artifact generation and verification.
- Manifest must record original path, new path, and the record/dedupe group each file contributed to.

#### FR-10: Idempotency / rerun safety
A rerun should not create drift or duplicate business rows.

**Rules:**
- Output should be deterministic for the same inputs.
- Manifest should include file hash/checksum and record hash.
- The tool should be able to skip or re-evaluate files already moved if explicitly instructed, but default behavior is to process only files still in `data/old-contracts/`.

---

### 6.2 Non-Functional Requirements
- Stable, boring implementation over cleverness
- Clear logs for every major decision path
- No silent data loss
- UTF-8 everywhere
- Works on mixed-quality phone photos as best effort
- Reasonable runtime for the actual folder size
- Can be executed locally by operator/dev without product deployment

### 6.3 Security & Privacy
- Historical contracts likely contain personal data. Keep all processing local or inside approved infrastructure.
- Do not leak OCR text or PII into client-side production code.
- Do not commit raw extracted PII artifacts unless the repo already has an approved pattern for this data.
- If temporary OCR intermediates are written, keep them in ignored local artifacts unless explicitly approved.

---

## 7. Data Mapping / Contracts

### 7.1 Destination table strategy
Hawkeye must inspect the current schema and identify the exact destination table. Use this notation during planning:

- `TARGET_TABLE`: existing historical-rental-compatible table in Supabase
- `TARGET_COLUMNS`: exact ordered header list required for import

### 7.2 Mapping rule
Build a mapping layer from extracted legacy fields to `TARGET_COLUMNS`.

**Mandate:** map only to columns that already exist. Do not change the schema just to make the import prettier unless a documented blocker proves it is necessary.

### 7.3 Suggested conceptual mapping
These are concepts, not final column names:
- customer name
- phone
- email
- motorcycle reference
- start date
- end date
- total amount
- deposit
- status
- notes/internal note
- source provenance if the current schema already has a notes/meta field

### 7.4 Historical status mapping
If the current schema has statuses, imported legacy rentals must use the schema’s existing value representing a confirmed/completed historical rental, not a pending request.

Decision rule:
- If rental end date is in the past and schema supports `completed`, use that.
- Otherwise use the nearest existing approved/confirmed historical-equivalent status in the schema.
- No new enum values without ADR.

---

## 8. Pipeline Design

### Phase A: Preflight
- Validate presence of `data/old-contracts/`
- Validate presence of `Karen & JJ moto rental - Alquileres.csv`
- Validate target schema mapping config
- Create output directories if missing
- Refuse to run if target schema binding is unresolved

### Phase B: OCR and normalization
- OCR each image
- Normalize whitespace, accents, punctuation, common OCR confusions
- Extract candidate fields using pattern library and document heuristics
- Store per-field confidence

### Phase C: Reconciliation
- Load CSV rows
- Normalize candidate match keys from CSV and OCR
- Match contract to CSV row using weighted scoring
- Take canonical customer name from CSV where matched
- Keep contract dates unless unreadable

### Phase D: Record assembly
- Convert each contract or group of duplicate images into one logical rental candidate
- Validate mandatory fields against target schema requirements
- Mark uncertainty

### Phase E: Deduplication
- Deduplicate by normalized name + start date + end date
- Merge provenance from all source files into one logical record

### Phase F: Emit artifacts
- Write import CSV
- Write review CSV
- Write manifest JSON
- Verify row counts and file movement plan

### Phase G: Move files
- Move success files and duplicate-resolved files out of `data/old-contracts`
- Leave unresolved files in place
- Update manifest with final paths

---

## 9. Failure Modes & Handling
- **OCR unreadable:** keep file in `data/old-contracts`, add review entry
- **Name ambiguous across multiple CSV rows:** choose best candidate, import only if mandatory fields are strong, log ambiguity
- **Date unreadable or invalid:** attempt parse repair only when evidence is explicit, else review
- **Schema mismatch:** fail fast before processing
- **Multiple vehicles inferred:** review unless one is clearly dominant in contract text
- **Duplicate conflicts on price/deposit:** choose highest-confidence field and log conflict
- **Import row missing required target column:** do not include in import CSV, add review entry
- **Artifact write failure:** do not move any source files

---

## 10. Observability
At minimum log:
- files discovered
- files processed
- files imported
- files flagged for review
- duplicate groups created
- CSV matches found vs not found
- date corrections applied
- output row count
- moved files count by directory

Manifest must summarize:
- total input files
- total logical rentals found
- total importable rows
- total review rows
- total duplicate files
- total moved to success
- total moved to duplicates
- total remaining unresolved

---

## 11. Acceptance Criteria

### Global
- [ ] Destination schema/table is taken from the current repo, not invented in this spec.
- [ ] Running the tool on `data/old-contracts` plus the named CSV produces a Supabase-importable CSV.
- [ ] The import CSV contains only one row per deduplicated rental.
- [ ] Duplicate photos with the same normalized name + start date + end date do not create duplicate import rows.
- [ ] Readable contract dates override CSV dates.
- [ ] Credibly matched CSV names override OCR names.
- [ ] All imported rows can be traced to source files via the review artifact and manifest.
- [ ] Successfully represented files are moved out of `data/old-contracts`.
- [ ] Unresolved files remain in `data/old-contracts`.
- [ ] The run is repeatable without generating duplicate business rows.

### QA sample bar
On a manually reviewed sample of at least 25 logical rentals, or the full set if smaller:
- [ ] Name accuracy after CSV reconciliation is at least 95%
- [ ] Start/end date accuracy is at least 90%
- [ ] Duplicate suppression accuracy is 100% on observed duplicate-photo cases
- [ ] Every uncertain or guessed field is surfaced in the review artifact

---

## 12. Test Plan

### Unit
- date parser for `DD/MM/YYYY`
- date parser for `DD/MM/YY`
- two-digit year normalization
- OCR text normalization helpers
- name normalization and fuzzy matching
- dedupe key generation
- manifest generation

### Integration
- end-to-end on a small fixture set with:
  - one clean contract
  - one duplicate-photo pair
  - one contract with ambiguous CSV match
  - one contract with malformed CSV date but readable contract date
  - one contract with unreadable field that should land in review
- verify exact output headers equal `TARGET_COLUMNS`
- verify moved files leave only unresolved items in `data/old-contracts`

### Manual QA script
1. Run tool on a copied sample set.
2. Inspect `legacy_rentals_supabase_import.csv`.
3. Inspect `legacy_rentals_review.csv`.
4. Verify 5 random imported rows against source images.
5. Verify 5 duplicate-photo cases collapse to single row.
6. Verify unresolved files remain in input directory.
7. Dry-run import into Supabase or a staging table first.

### Security/abuse
- Ensure no raw PII is logged unnecessarily to console in verbose mode by default.
- Ensure temp files are not left in tracked repo locations.

---

## 13. Implementation Notes for Hawkeye / Cowgirl
- Preferred shape is a CLI utility under `scripts/` or `tools/`, not product UI.
- Prefer Python for OCR/image/CSV ergonomics unless the repo already has a stronger Node-based scripts pattern.
- Keep OCR provider behind a clean interface so the parsing and reconciliation layers are not vendor-coupled.
- Use a staged architecture:
  1. ingest
  2. OCR
  3. extract
  4. reconcile
  5. dedupe
  6. emit
  7. move
- Build in a `dry-run` mode that writes artifacts without moving files.
- Build in a `review-threshold` so low-confidence rows are kept out of import CSV if needed.

---

## 14. ADRs

### ADR-20260314-legacy-backfill-as-cli
**Context:** This is a historical data migration problem, not a live user workflow.  
**Decision:** Implement as a local/admin CLI pipeline, not an app feature.  
**Tradeoffs:** Less UI polish, much faster delivery, lower production risk.  
**Consequences:** Operators run it deliberately; no customer exposure.  
**Verification:** If the team starts designing screens for this, the scope has drifted.

### ADR-20260314-contract-dates-over-csv-dates
**Context:** The source CSV has known date errors.  
**Decision:** Treat readable contract dates as authoritative.  
**Tradeoffs:** OCR must be strong enough to parse dates reliably.  
**Consequences:** CSV is used primarily to clean names, not to drive dates.  
**Verification:** If imported dates keep matching the bad CSV over readable contracts, the implementation is wrong.

### ADR-20260314-sidecar-review-instead-of-schema-change
**Context:** Uncertainty and provenance matter, but the existing schema may not have fields for them.  
**Decision:** Keep confidence/provenance in sidecar artifacts unless existing schema already supports storage.  
**Tradeoffs:** Review data lives outside primary table.  
**Consequences:** Import CSV stays schema-clean.  
**Verification:** If implementation adds new columns without necessity, revisit.

---

## 15. Work Order Decomposition

# WORK_ORDER: Legacy contract OCR backfill
Project: MOTO-RENTAL  
Milestone: Historical data import  
Owner: Foreman  
Reviewers: Hawkeye (gate), Chief (spot-check)  
Status: Draft

## Objective
Create a repeatable OCR backfill utility that converts historical contract images and the legacy CSV into a clean Supabase import file while leaving a visible review queue for unresolved cases.

## Dependencies
- Access to current repo schema/migrations
- Sample contract files in `data/old-contracts`
- CSV file in same directory
- Approved OCR provider/config

## Plan (Phases)

### Phase 1 — Schema bind + fixture capture
**Deliverables**
- exact target table identified
- exact `TARGET_COLUMNS` documented
- sample fixtures selected
- field mapping doc complete

**Acceptance Criteria**
- [ ] No ambiguous destination table remains
- [ ] Header contract for import CSV is fixed
- [ ] Required vs nullable fields are explicit

**Gate**
- Gate 1: Hawkeye review required

### Phase 2 — OCR + extraction + reconciliation
**Deliverables**
- OCR pipeline
- field extraction logic
- CSV name reconciliation logic
- confidence scoring

**Acceptance Criteria**
- [ ] Clean sample contracts extract correctly
- [ ] CSV name override works on matched samples
- [ ] Contract dates beat CSV dates on conflicting samples

**Gate**
- Gate 2: Hawkeye review required

### Phase 3 — Dedupe + artifact emission + file movement
**Deliverables**
- dedupe pipeline
- import CSV
- review CSV
- manifest
- file movement logic
- dry-run mode

**Acceptance Criteria**
- [ ] Duplicate-photo cases collapse to one record
- [ ] Successful files move out of input directory
- [ ] Dry-run produces same logical records without moving files

**Gate**
- Gate 3: Hawkeye review required

### Phase 4 — QA + staged import rehearsal
**Deliverables**
- tested run on real subset
- QA notes
- staged Supabase import rehearsal
- bug fixes

**Acceptance Criteria**
- [ ] QA sample bar met
- [ ] Import file accepted by Supabase staging import
- [ ] Remaining unresolved cases clearly surfaced

**Gate**
- Gate 4: Hawkeye review required, Chief spot-check optional

---

## Risks
- Risk: OCR quality is poor on some images  
  Mitigation: confidence scoring, review artifact, dry-run, optional provider tuning

- Risk: Existing schema is request-centric and not cleanly shaped for historical rentals  
  Mitigation: schema bind first, ADR if staging transform is required

- Risk: CSV-to-contract matching is ambiguous on common names  
  Mitigation: multi-signal matching, ambiguity logs, conservative import rules

- Risk: File movement could hide unresolved issues  
  Mitigation: move only on successful artifact generation; unresolved stay in place

---

## Blockers
- Missing exact schema/table definition in this prompt. Team must bind to the repo’s real schema before implementation.
- Unknown OCR provider choice. Team should pick the strongest boring option compatible with operator constraints and document it.

---

## State Heartbeat
State · Project: MOTO-RENTAL  
Phase: 0 · Milestone: Historical data import  
Focus: Define legacy contract OCR backfill with schema-bound Supabase import output  
Last shipped: This build brief + tech spec  
Open loops: [1] Bind exact target table and columns from current repo [2] Choose OCR provider and run fixture test  
Risks (top 2): (a) OCR quality on noisy photos (b) schema mismatch with legacy data  
Next 2 steps: (a) Hawkeye binds schema and mapping (b) Cowgirl builds dry-run pipeline on sample set
