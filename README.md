# AILA Personalization Runbook

This repo is the local drafting area for the AILA personalization workflow.

The live system runs from Google Sheets, Google Docs, Google Drive, Apps Script, and Kit.
This repo exists so we can keep the source code in `.js`, review it locally, and then deploy it into the live Apps Script project with `@google/clasp`.

## What Lives Where

**Live Google Sheet**

- This is the source of truth for learners, transcripts, blueprint, metadata, generated `COURSE_*` content, and delivery status.
- Row `1` is the header row.
- Row `2` is the course-instruction row for generated `COURSE_*` columns.
- Row `3+` are learner rows.

**Live Google Doc: final learner prompt guide**

- This is the template used to build each learner’s Google Doc and PDF.
- The runtime reads this via `TEMPLATE_DOC_ID` in [app_scripts/personalized_docs.js](/Users/quang/Desktop/DEV/personalization_scripts/app_scripts/personalized_docs.js).
- This doc should keep the stable prompt scaffold directly in the template and only use `{{ COURSE_* }}` where the content truly needs personalized generation.

**Local repo**

- [app_scripts/openai.js](/Users/quang/Desktop/DEV/personalization_scripts/app_scripts/openai.js): generation, intake, enrichment backfill
- [app_scripts/personalized_docs.js](/Users/quang/Desktop/DEV/personalization_scripts/app_scripts/personalized_docs.js): preflight, doc build, PDF build, Kit sync
- [app_scripts/kit.js](/Users/quang/Desktop/DEV/personalization_scripts/app_scripts/kit.js): menus and shared helpers
- [app_scripts/s3.js](/Users/quang/Desktop/DEV/personalization_scripts/app_scripts/s3.js): transcript intake webhook
- [prompt-guide_instructions.md](/Users/quang/Desktop/DEV/personalization_scripts/prompt-guide_instructions.md): current local reference for generated `COURSE_*` instruction sections
- [prompt-guide_template.md](/Users/quang/Desktop/DEV/personalization_scripts/prompt-guide_template.md): local reference copy of the final guide structure
- [prompt-guide_wip.md](/Users/quang/Desktop/DEV/personalization_scripts/prompt-guide_wip.md): archived draft, superseded by `prompt-guide_instructions.md`

## File To Use

Use [app_scripts/personalized_docs.js](/Users/quang/Desktop/DEV/personalization_scripts/app_scripts/personalized_docs.js).

## Source Of Truth Rules

**Do**

- edit the live Google Sheet for learner data and generated values
- edit the live Google Docs for prompt-guide content
- keep local source files in `.js`
- push local `.js` code into the live Apps Script project with `clasp`

**Do not**

- treat local CSV files as runtime source of truth
- treat local markdown files as runtime inputs
- rely on backward-compatible column aliases

The live sheet and live prompt docs must use the final naming convention directly.

## Naming Conventions

The project now uses three different bracket styles with different meanings:

**`[[ ... ]]`**

- AI fills this.
- This is authoring syntax inside row `2` template cells.
- During generation, it becomes `[INFERRED: ...]`.
- Example:

```text
[[the world's most respected named expert or expert type related to role and challenge]]
```

**`[ ... ]`**

- The square brackets are preserved in the final prompt.
- Use plain text inside brackets when the learner should fill it manually.
- Use a runtime variable inside brackets when you want the system to fill it but keep the bracketed style in the prompt.
- Example:

```text
[describe the challenge in 2–3 sentences; be specific]
[{{ ROLE }}]
[{{ COMPANY }}]
```

**`{{ VARIABLE }}`**

- Runtime/system variable.
- Must match a real column header in the live sheet exactly.
- Can be used on its own or inside square brackets.
- Example:

```text
{{ ROLE }}
{{ COMPANY }}
{{ COURSE_DAY2_01 }}
```

## Core Runtime Variables

Use these as the default reusable learner-profile variables:

- `{{ NAME }}`
- `{{ ROLE }}`
- `{{ COMPANY }}`
- `{{ INDUSTRY }}`

When the prompt should visibly keep the bracketed placeholder style, write them like this:

```text
[{{ NAME }}]
[{{ ROLE }}]
[{{ COMPANY }}]
[{{ INDUSTRY }}]
```

Do not create extra `COURSE_*` columns for simple identity wrappers like:

- `I am {{ NAME }}`
- `{{ ROLE }} at {{ COMPANY }}`
- `{{ ROLE }} in {{ INDUSTRY }}`

Use the core runtime variables directly instead.

## Sheets AI Formulas

### ADVISORS (Day 5 Personal BOD)

Column mapping (Row 3): B3=Name, F3=BLUEPRINT, G3=ROLE, H3=COMPANY, I3=INDUSTRY

```
=AI(
"Task: Pick the 3 best advisors/coaches for this person (assume unlimited budget and access).

Infer from the Blueprint:
- background (role, seniority, domain)
- goals (6–24m and long-term)
- values
- constraints
- bottlenecks

Selection rules:
- 3 real, living, globally verifiable public figures with a strong public footprint
- no obscure or invented names
- 1 per lane: strategy/operator, craft/domain mastery, performance/leadership/psychology
- fit > fame
- minimize overlap
- cover distinct failure modes
- prefer less obvious names only when fit is stronger

Output:
- ONLY 3 blocks, separated by ONE blank line
- each block exactly 2 lines:
  {n}) {Name} — {Role}
  Lens: {3–8 comma-separated phrases}
- no rationale
- no extra text

Blueprint:
" & $F3
)
```

## Final Column Convention

The live sheet should use the final column names directly.

**Days 1–4 (technique demos):** `COURSE_DAY{N}_{NN}`

- `COURSE_DAY1_00`
- `COURSE_DAY2_00` (CODO SuperPrompt)
- `COURSE_DAY2_01` to `COURSE_DAY2_04` (advanced techniques)

**Day 5+ (assistant builders):** `COURSE_{SHORTNAME}_ASSISTANT`

- `COURSE_BOD_ASSISTANT` (Day 5 — Board of Directors)
- `COURSE_INSIGHT_ASSISTANT` (Day 6)
- `COURSE_DEEP_RESEARCH_ASSISTANT` (Day 7)
- `COURSE_EMAIL_ASSISTANT` (Day 8)
- `COURSE_WRITING_ASSISTANT` (Day 8)
- `COURSE_DATA_ASSISTANT` (Day 8)
- `COURSE_MEETING_ASSISTANT` (Day 8)
- `COURSE_PRESENTATION_ASSISTANT` (Day 9)
- `COURSE_VISUAL_ASSISTANT` (Day 9)
- `COURSE_AVATAR_ASSISTANT` (Day 9)
- `COURSE_VIBECODING_ASSISTANT` (Day 10)

**Pre-step variables (sheet-only, not `COURSE_*`):**

- `ADVISORS` (Day 5)
- `TOPICS` (Day 6)
- `EMAIL_SITUATION`, `EMAIL_GOAL`, `EMAIL_GUARDRAILS` (Day 8)
- `WORKFLOW` (Day 8)
- `DATA_DATASET` (Day 8)
- `MEETING_NAME` (Day 8)
- `PRESENTATION_TYPE` (Day 9)
- `IMAGE_PROCESS`, `IMAGE_TITLE` (Day 9)
- `VIDEO_TEACHABLE`, `VIDEO_LIST` (Day 9)
- `VIBECODING_IDEA` (Day 10)

For Day 2:

- reuse `COURSE_DAY1_00` for the repeated Day 2 basic prompt
- use `COURSE_DAY2_00` for the CODO SuperPrompt
- use `COURSE_DAY2_01` to `COURSE_DAY2_04` for the advanced techniques

For Day 3:

- the basic multimodal prompt is fully static in the final guide template
- keep the advanced multimodal prompt directly in the final guide template when it only needs runtime variables like `[{{ NAME }}]`, `[{{ ROLE }}]`, `[{{ COMPANY }}]`, and `[{{ INDUSTRY }}]`

## Script Properties

Set these in the live Apps Script project:

**Required**

- `OPENAI_API_KEY`
- `KIT_API_KEY`

**Required for enrichment backfill**

- `ENRICHMENT_SHEET_ID`

**Optional**

- `ENRICHMENT_SHEET_NAME`

## Bun + clasp Setup

1. Run `bun install`.
2. Run `bunx clasp login`.
3. Copy `.clasp.json.example` to `.clasp.json`.
4. Add your live Apps Script `scriptId` to `.clasp.json`.
5. Copy `.clasp-deploy.json.example` to `.clasp-deploy.json`.
6. Add your current web app `deploymentId` to `.clasp-deploy.json` if you already have a stable deployment URL.

Use these commands for the local Apps Script workflow:

- `bun run clasp:status`: show which files under `app_scripts/` will be pushed
- `bun run clasp:pull`: pull the current remote project into `app_scripts/`
- `bun run clasp:push`: push the local `app_scripts/` source into Apps Script
- `bun run clasp:open`: open the Apps Script project in the browser
- `bun run clasp:deploy`: push local code, create a new version, and redeploy the saved `deploymentId`
- `bun run clasp:deploy:new`: push local code and create a brand new deployment

Use `bun run clasp:deploy:new` the first time you need a web app deployment or when you intentionally want a new deployment URL.
After that first deploy, save the returned deployment ID into `.clasp-deploy.json` so `bun run clasp:deploy` keeps the same web app URL.

## How Row 2 Templates Should Be Written

Write the template directly into row `2` under the matching `COURSE_*` header.

Each generated cell should look like this:

```text
Character:
You are [[the world's most respected named expert or expert type related to role and challenge]] in [{{ INDUSTRY }}]; someone who cuts through complex challenges and finds what actually works.

Objective:
I'm [{{ ROLE }}] at [{{ COMPANY }}]. My biggest recurring challenge right now is [[primary work challenge]]. Give me five specific ways I could tackle this.
```

Rules:

- the row `2` cell belongs under the matching live sheet column header
- `[[...]]` is for model inference
- `[free text]` is learner fill text, while `[{{ VARIABLE }}]` is a runtime-filled variable that keeps the brackets
- `{{ ... }}` must point to a real column header
- blank lines are preserved
- fenced code blocks are stripped before generation

For stable learner identity context, prefer `[{{ NAME }}]`, `[{{ ROLE }}]`, `[{{ COMPANY }}]`, and `[{{ INDUSTRY }}]` over creating a separate generated `COURSE_*` field.
For sections that can be written fully with runtime variables and fixed prompt scaffolding, keep them in the final guide template and do not create a generated `COURSE_*` field.

## Human Workflow For Updating Content

1. Finalize or revise the learner-facing prompt guide in the live Google Doc.
2. Finalize or revise row `2` templates for each generated `COURSE_*` column directly in the live sheet.
3. Rename live sheet columns to match the final convention exactly.
4. Spot-check row `2` for a few key columns.
5. Run generation on a small learner sample before batch generation.

If a section is static except for core learner identity, keep it in the final guide template and use the core runtime variables directly. Do not create a day-specific `COURSE_*` column for that section.

If a section mixes stable teaching scaffolding with personalized text, keep the stable `Do`, `Don't`, `Output`, examples, and formatting in the final guide template. Put only the personalized fragment in the generated `COURSE_*` variable.

Example:

```text
{{ COURSE_DAY2_00 }}

Do:
- stable instruction 1
- stable instruction 2

Don't:
- stable instruction 3

Output:
- stable output format
```

## Human Workflow For Metadata

1. Make sure transcripts are present in the personalized sheet.
2. Run `Generate BLUEPRINT` for missing rows. This starts the async intake pipeline: Batch API generation for `BLUEPRINT`, `ROLE`, `COMPANY`, `INDUSTRY`, and `COURSE_GOAL`, result import, metadata backfill, and industry normalization.
3. Wait for the pipeline trigger to finish. Use the hidden usage/cache sheets only for troubleshooting.
4. Manually resolve any remaining ambiguous rows.
5. If needed, do web research for high-confidence metadata only.

Never guess missing metadata.

## Human Workflow For Friday Delivery

1. Confirm the live sheet has the final Day 1 to Day 10 headers.
2. Confirm row `2` contains the final course instructions.
3. Run `bun run clasp:push` to sync the latest local Apps Script files.
4. If the deployed web app behavior changed, run `bun run clasp:deploy` to refresh the stable web app deployment.
5. Run `Preflight all rows` from `Personalized Docs`.
6. Review blocked learners.
7. Fix missing data or missing generated content.
8. Run content generation for missing `COURSE_*` values.
9. Run `Build docs + PDFs for all rows`.
10. Spot-check several learner docs and PDFs.
11. Run `Sync PDF links to Kit for all rows`.
12. Confirm the PDF URL is present in the Kit field `PDF_URL`.
13. Proceed with email send.

Delivery scope is `complete only`.

That means a learner is delivered only when all of these are true:

- transcript exists
- `BLUEPRINT`, `ROLE`, `COMPANY`, `INDUSTRY`, `COURSE_GOAL` are resolved
- required `COURSE_*` outputs are populated
- doc builds successfully
- PDF builds successfully
- Kit sync succeeds

## What The Apps Script Menus Do

**OpenAI**

- generate personalized `COURSE_*` content
- run selected missing `COURSE_*` content through an async OpenAI Batch API job under the existing generate menu items
- hidden `_OPENAI_CACHE`, `_OPENAI_USAGE`, and `_OPENAI_BATCH_ITEMS` sheets are created automatically when needed
- hidden OpenAI sheets are append-only by default to avoid spreadsheet timeout errors on large documents

**Intake**

- generate `BLUEPRINT`
- generate `BLUEPRINT`, `ROLE`, `COMPANY`, `INDUSTRY`, and `COURSE_GOAL` through one async OpenAI Batch API job
- continue the intake pipeline automatically after the batch completes: import results, backfill remaining metadata, normalize `INDUSTRY`
- backfill `ROLE`, `COMPANY`, `INDUSTRY` from enrichment

**Personalized Docs**

- preflight readiness
- build Google Docs
- export PDFs
- sync PDF links to Kit
- run the full phased delivery flow

## What clasp Pushes To Apps Script

`clasp` pushes the files inside `app_scripts/` into the live Apps Script project:

- [app_scripts/appsscript.json](/Users/quang/Desktop/DEV/personalization_scripts/app_scripts/appsscript.json)
- [app_scripts/openai.js](/Users/quang/Desktop/DEV/personalization_scripts/app_scripts/openai.js)
- [app_scripts/personalized_docs.js](/Users/quang/Desktop/DEV/personalization_scripts/app_scripts/personalized_docs.js)
- [app_scripts/kit.js](/Users/quang/Desktop/DEV/personalization_scripts/app_scripts/kit.js)
- [app_scripts/s3.js](/Users/quang/Desktop/DEV/personalization_scripts/app_scripts/s3.js)

Keep the local source in `.js`. `clasp` will sync that source into Apps Script.

## Current Limits

- The runtime does not generate the final guide structure from the markdown files in this repo.
- The runtime reads the live Google Docs and the live Google Sheet.
- `[[...]]` support currently exists only in row `2` template cells for generated `COURSE_*` content.
- `{{ ... }}` replacement in the learner-facing guide still expects exact matching live sheet headers.
- OpenAI Batch API import writes only blank target cells, so existing reviewed content is not overwritten.
- OpenAI Batch API completion is async; the generate menu items install a time trigger that imports results after completion.

## Quick Troubleshooting

**`Missing Script Property`**

- Add the missing property in Apps Script project settings.

**Preflight blocked on a placeholder**

- The live sheet is missing that header, or the learner row is missing the value.

**PDF built but Kit not updated**

- Re-run `Sync PDF links to Kit`.
- Do not rebuild docs unless the content actually changed.

**Manual learner-fill text got changed**

- Use single brackets `[ ... ]` for learner-fill content.
- Use double brackets `[[ ... ]]` only for AI-inferred content in row `2` templates.
