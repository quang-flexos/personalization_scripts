/**
 * openai.gs
 * Single OpenAI version (no v1/v2 split)
 */

// =========================
// OPENAI GENERATOR CONFIG
// =========================
const OPENAI_PROMPT_ID = 'pmpt_697c7885ce988197a458c2ec8d49613e0e39c7a7a0def1b9';

const OPENAI_CFG = {
  API_URL: 'https://api.openai.com/v1/responses',
  MAX_ROWS_PER_RUN: 100,
  SLEEP_MS: 300,
  STORE: true,
  REASONING_SUMMARY: 'auto',
  COURSE_PREFIX: 'COURSE_',
};

// =========================
// INTAKE CONFIG
// =========================
const INTAKE_MODEL = 'gpt-5.4-mini-2026-03-17';
const INTAKE_API_URL = 'https://api.openai.com/v1/responses';

const INTAKE_OUTPUT_HEADERS = {
  BLUEPRINT: 'BLUEPRINT',
  ROLE: 'ROLE',
  COMPANY: 'COMPANY',
  INDUSTRY: 'INDUSTRY',
};

const ENRICHMENT_BACKFILL_CFG = {
  SPREADSHEET_ID_PROPERTY: 'ENRICHMENT_SHEET_ID',
  SHEET_NAME_PROPERTY: 'ENRICHMENT_SHEET_NAME',
  EMAIL_HEADER: 'Email',
  ROLE_HEADER: 'Title',
  COMPANY_HEADER: 'Company',
  INDUSTRY_HEADER: 'Industry',
};

const INTAKE_BLUEPRINT_SYSTEM_PROMPT = `You are an Executive Intake Synthesizer for an AI Executive Boot Camp.
Reference: executive-profile-template.md (required headings + order + bullet style).

Task:
- Given an intake transcript, output exactly one thing: BLUEPRINT following the template exactly.

Rules:
- Transcript is the only source of truth.
- If missing/unclear: write "Not specified". Do not guess.
- No added/removed sections. Keep headings identical and in the same order.
- Bullets: <= 1 sentence, 1–3 bullets per list (aim ~1 page).
- No causal claims unless explicit. If you include a plausible interpretation, tag "[assumption]" inline.

Normalization (only when clearly intended):
- Fix obvious transcript typos for known entities/tools: "ChatView PT"->"ChatGPT", "Brock"->"Grok", "bead dot io"->"Veed", "beautiful dot AI"->"Beautiful.ai".
- Preserve user-corrected spellings (e.g., "in beta, i n b e t a").

Location:
- "Location" is personal city/country only. If only client geography is mentioned, write "Not specified".
- Client geography can appear under role/context bullets.

Time reallocation:
- "Reallocation of 10 hours" must match their direct answer (no linking to AI unless explicit).
- In "Why AI now / time reallocation", only mention reinvesting time if explicitly linked to AI; otherwise write "Not specified".

KPI/Target:
- If no numeric KPI, use an observable qualitative KPI using their words.
- Baseline: include self-rating, current tool usage, current limits (from transcript).
- Target: observable 90-day shift grounded in transcript; no invented numbers.

Conflicts:
- Prefer clearest + most recent statement.

Output:
Return ONLY strict JSON: {"blueprint":"..."} (no other keys, no markdown, no commentary).`.trim();

const INTAKE_FIELDS_SYSTEM_PROMPT = `You are an Executive Intake Extractor for an AI Executive Boot Camp.
Reference: the transcript only.

Task:
- Extract ROLE, COMPANY, and INDUSTRY from the intake transcript when clearly stated.

Rules:
- Transcript is the only source of truth.
- If missing/unclear: leave the field empty. Do not guess.
- Return short plain strings only. No markdown. No explanations.
- Prefer the clearest current role/company/industry if multiple are mentioned.

Extraction rules for structured fields:
- ROLE: the person's current job title, role, or function only when explicitly stated.
- COMPANY: their employer, company, or organization only when an explicit name is stated.
- INDUSTRY: their industry, sector, or market only when explicitly stated.
- INDUSTRY must be a concise category label, not a descriptive sentence or list.
- INDUSTRY should usually be 1-5 words, title case, and broad enough to be reusable across prompts.
- Prefer a clean market label such as "Technology", "Real Estate", "Higher Education", or "Food & Facility Management Services".
- If multiple are mentioned, prefer the clearest current one.
- If a field is missing or unclear, return an empty string.
- Do not infer from adjacent context, client work, product descriptions, domain knowledge, or likely business type.
- Do not turn a business description into a company name.
- Do not return long multi-part descriptions such as "think tank, executive education, and corporate advisory services".
- Do not output placeholders like "Not specified", "Unknown", "N/A", or explanatory notes.

Examples of what NOT to do:
- If they say they run a branding consultancy but never name it, COMPANY = "".
- If they discuss medtech clients or wearable sensors but never state their own industry, INDUSTRY = "".
- If "founder" is only implied by owning a business and not explicitly said, ROLE = "".

Normalization (only when clearly intended):
- Fix obvious transcript typos for known entities/tools: "ChatView PT"->"ChatGPT", "Brock"->"Grok", "bead dot io"->"Veed", "beautiful dot AI"->"Beautiful.ai".
- Preserve user-corrected spellings (e.g., "in beta, i n b e t a").

Output:
Return ONLY strict JSON: {"role":"...","company":"...","industry":"..."} (no other keys, no markdown, no commentary).`.trim();

const EXEC_PROFILE_TEMPLATE = `Name: [Full name]
Role: [Job title(s)]
Location: [Personal country/city if mentioned; otherwise leave empty (do not use client geography)]

---

## A) Identity & Goals

### Current role, function, industry, team size
- [Who they are, what they do day-to-day.]
- [Industry / sector context.]
- [Team size, leadership level, decision authority.]

### Specific 90-day outcome
- Goal: [Concrete outcome they want from the bootcamp.]
- KPI: [How success will be recognized or measured.]
- Baseline: [Current state, tools, or skills.]
- Target: [Clear, realistic shift in 90 days.]

### Why AI now / time reallocation
- [What's changing in their work or market.]
- [Which activities AI should reduce/replace.]
- [Where they'd like to reinvest time if explicitly linked to AI; otherwise leave empty.]

### Primary stakeholders & value definition
- [Key stakeholders: roles, groups, or customers.]
- [What "value" means in their context (e.g., revenue, efficiency, culture).]

### "Why" for AI (personal time)
- [Personal motivations, lifestyle, family, health, or freedom drivers.]

---

## B) AI Posture & Risk

### Tools used today
- [Daily tools.]
- [Weekly / exploratory tools.]
- [Satisfaction notes for each, if mentioned.]

### Biggest frustration
- [What isn't working with AI now; include 1–2 examples.]

### Confidence / maturity
- Self-rating: [number if given, otherwise qualitative level.]
- Confidence summary: [e.g., "Beginner / Intermediate / Advanced with brief justification."]

### Blockers / risks
- [Budget, culture, compliance, accuracy, change management, etc.]

### Workflow automation
- [Current use of Zapier/Make/others.]
- [App connections or ideas they mention.]
- If none: "No current automation; interest level = [high/medium/low]."

---

## C) Core Workflows & Knowledge

### Top repeatable workflows for AI
1. [Workflow 1 – short phrase + what "good" looks like.]
2. [Workflow 2…]
3. [Workflow 3…]
4–5. [Only if clearly stated; otherwise stop at 3.]

### Writing / presentation outputs
- [What they write/create (reports, decks, emails, posts).]
- [Frequency and audience.]
- Voice: [How their voice should feel; quote their words if useful.]

### Research
- [What they research and how deep (quick scan vs deep dive).]
- [Sectors, topics, or typical sources.]

### Meetings
- [Typical meeting types they run.]
- [Who is in the room.]
- [Downstream artifacts: decisions, actions, docs.]

### Recurring problem
- [Work problems they repeat or complain about.]
- [Where AI could realistically help.]

---

## D) Media & Languages

### Image/video use
- [Type and frequency of slides, visuals, videos.]
- [Quality or brand constraints.]

### Languages
- [Languages they work in; translation/localization needs.]
- If only one: "Primarily [language]; no multi-language needs mentioned."

---

## E) Stack, Access & Delivery

### Core stack
- [Email, office suite, chat, meeting tools, PM tools, AI tools, etc.]

### Compliance/privacy
- [Company rules, client expectations, or sensitivities around data.]

### Platform preferences
- [Tools / ecosystems they prefer or must use.]

### Lesson/follow-up preference
- [How they like to learn: live, async, templates, office hours, etc.]

---

## G) Purpose & Future

### Energy sources / drains
- [What gives them energy in work.]
- [What drains them.]

### Reallocation of 10 hours
- [How they would spend 10 extra hours per week.]

### Next 90 days success
- [What "this bootcamp worked" looks like in concrete terms.]

### 3–5 year snapshot
- [Role, lifestyle, impact they want in 3–5 years.]

### Legacy / contribution
- [How they want to be remembered professionally and/or personally].`.trim();

// =========================
// OPENAI GENERATOR (SELECTED ONLY)
// =========================
function openaiGenerateSelectedRowsSelectedCourseCols() {
  const ui = SpreadsheetApp.getUi();
  const sh = SpreadsheetApp.getActiveSheet();

  const ranges = getSelectedRanges_(sh);
  if (!ranges.length) return ui.alert('No selection.');

  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 3) return ui.alert('No data rows.');

  const data = sh.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = data[0].map(normalizeHeader_);

  const rows = getSelectedRowsFromRanges_(ranges, lastRow, 3);
  if (!rows.length) return ui.alert('Select at least one data row (row 3+).');

  const cols = getSelectedCourseColsFromRanges_(ranges, lastCol, headers, OPENAI_CFG.COURSE_PREFIX);
  if (!cols.length) return ui.alert('No COURSE_ columns in selection.');

  const result = runOpenAIGenerator_(sh, headers, data, rows, cols);
  ui.alert(`Done. Wrote: ${result.writes}, Skipped: ${result.skipped}, Errors: ${result.errors}`);
}

function openaiGenerateSelectedRowsAllCourseCols() {
  const ui = SpreadsheetApp.getUi();
  const sh = SpreadsheetApp.getActiveSheet();

  const ranges = getSelectedRanges_(sh);
  if (!ranges.length) return ui.alert('No selection.');

  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 3) return ui.alert('No data rows.');

  const data = sh.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = data[0].map(normalizeHeader_);

  const rows = getSelectedRowsFromRanges_(ranges, lastRow, 3);
  if (!rows.length) return ui.alert('Select at least one data row (row 3+).');

  const cols = getAllCourseCols_(headers, OPENAI_CFG.COURSE_PREFIX);
  if (!cols.length) return ui.alert('No COURSE_ columns found.');

  const result = runOpenAIGenerator_(sh, headers, data, rows, cols);
  ui.alert(`Done. Wrote: ${result.writes}, Skipped: ${result.skipped}, Errors: ${result.errors}`);
}

function runOpenAIGenerator_(sh, headers, data, rows, cols) {
  const bpCol = headers.findIndex(h => String(h).toUpperCase() === INTAKE_OUTPUT_HEADERS.BLUEPRINT);
  if (bpCol === -1) throw new Error('Missing BLUEPRINT header');

  let writes = 0;
  let skipped = 0;
  let errors = 0;

  const colTemplates = [];
  for (const c of cols) {
    const header = headers[c] || '';
    if (/_BEFORE$/i.test(header) || /_AFTER$/i.test(header)) continue;

    const templateRaw = String(data[1][c] || '').trim();
    if (!templateRaw) continue;

    const directMode = templateRaw.startsWith('=');
    const template = compileCourseInstructionTemplate_(
      directMode ? templateRaw.slice(1).trim() : templateRaw,
    );
    colTemplates.push({ col: c, template, directMode });
  }

  if (!colTemplates.length) throw new Error('No COURSE_ columns with templates in row 2');

  for (const r of rows.slice(0, OPENAI_CFG.MAX_ROWS_PER_RUN)) {
    const blueprint = String(data[r - 1][bpCol] || '').trim();
    if (!blueprint) {
      skipped++;
      continue;
    }

    const rowVars = rowToVars_(headers, data[r - 1]);

    for (const ct of colTemplates) {
      const existing = String(data[r - 1][ct.col] || '').trim();
      if (existing) {
        skipped++;
        continue;
      }

      const course_instruction = interpolate_(ct.template, rowVars);

      if (ct.directMode) {
        sh.getRange(r, ct.col + 1).setValue(course_instruction);
        data[r - 1][ct.col] = course_instruction;
        writes++;
        continue;
      }

      try {
        const output = callOpenAI_(blueprint, course_instruction);
        sh.getRange(r, ct.col + 1).setValue(output);
        data[r - 1][ct.col] = output;
        writes++;
        Utilities.sleep(OPENAI_CFG.SLEEP_MS);
      } catch (e) {
        sh.getRange(r, ct.col + 1).setValue('ERROR: ' + e.message);
        errors++;
      }
    }
  }

  return { writes, skipped, errors };
}

function callOpenAI_(blueprint, course_instruction) {
  const payload = {
    prompt: {
      id: OPENAI_PROMPT_ID,
      variables: { blueprint, course_instruction },
    },
    input: [],
    reasoning: { summary: OPENAI_CFG.REASONING_SUMMARY },
    store: OPENAI_CFG.STORE,
  };

  const res = UrlFetchApp.fetch(OPENAI_CFG.API_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: `Bearer ${secret_('OPENAI_API_KEY')}` },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  const json = JSON.parse(res.getContentText());
  if (res.getResponseCode() >= 300) {
    throw new Error(json?.error?.message || 'OpenAI error');
  }

  return extractText_(json);
}

// =========================
// INTAKE
// =========================
function generateIntakeSelectedRows() {
  const ui = SpreadsheetApp.getUi();
  const sh = getSheet_();

  const ranges = getSelectedRanges_(sh);
  if (!ranges.length) return ui.alert('No selection.');

  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 3) return ui.alert('No data rows.');

  const data = sh.getRange(1, 1, lastRow, lastCol).getValues();
  const rows = getSelectedRowsFromRanges_(ranges, lastRow, 3);

  const result = runIntakeCombined_(sh, data, rows);
  ui.alert(`Done. Wrote: ${result.writes}, Skipped: ${result.skipped}, Errors: ${result.errors}`);
}

function generateIntakeAllMissing() {
  const ui = SpreadsheetApp.getUi();
  const sh = getSheet_();

  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 3) return ui.alert('No data rows.');

  const data = sh.getRange(1, 1, lastRow, lastCol).getValues();
  const rows = [];
  for (let r = 3; r <= lastRow; r++) rows.push(r);

  const result = runIntakeCombined_(sh, data, rows);
  ui.alert(`Done. Wrote: ${result.writes}, Skipped: ${result.skipped}, Errors: ${result.errors}`);
}

function generateIntakeBlueprintSelectedRows() {
  const ui = SpreadsheetApp.getUi();
  const sh = getSheet_();

  const ranges = getSelectedRanges_(sh);
  if (!ranges.length) return ui.alert('No selection.');

  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 3) return ui.alert('No data rows.');

  const data = sh.getRange(1, 1, lastRow, lastCol).getValues();
  const rows = getSelectedRowsFromRanges_(ranges, lastRow, 3);

  const result = runIntakeBlueprint_(sh, data, rows);
  ui.alert(`Done. Wrote: ${result.writes}, Skipped: ${result.skipped}, Errors: ${result.errors}`);
}

function generateIntakeBlueprintAllMissing() {
  const ui = SpreadsheetApp.getUi();
  const sh = getSheet_();

  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 3) return ui.alert('No data rows.');

  const data = sh.getRange(1, 1, lastRow, lastCol).getValues();
  const rows = [];
  for (let r = 3; r <= lastRow; r++) rows.push(r);

  const result = runIntakeBlueprint_(sh, data, rows);
  ui.alert(`Done. Wrote: ${result.writes}, Skipped: ${result.skipped}, Errors: ${result.errors}`);
}

function generateIntakeFieldsSelectedRows() {
  const ui = SpreadsheetApp.getUi();
  const sh = getSheet_();

  const ranges = getSelectedRanges_(sh);
  if (!ranges.length) return ui.alert('No selection.');

  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 3) return ui.alert('No data rows.');

  const data = sh.getRange(1, 1, lastRow, lastCol).getValues();
  const rows = getSelectedRowsFromRanges_(ranges, lastRow, 3);

  const result = runIntakeFields_(sh, data, rows);
  ui.alert(`Done. Wrote: ${result.writes}, Skipped: ${result.skipped}, Errors: ${result.errors}`);
}

function generateIntakeFieldsAllMissing() {
  const ui = SpreadsheetApp.getUi();
  const sh = getSheet_();

  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 3) return ui.alert('No data rows.');

  const data = sh.getRange(1, 1, lastRow, lastCol).getValues();
  const rows = [];
  for (let r = 3; r <= lastRow; r++) rows.push(r);

  const result = runIntakeFields_(sh, data, rows);
  ui.alert(`Done. Wrote: ${result.writes}, Skipped: ${result.skipped}, Errors: ${result.errors}`);
}

function backfillIntakeFieldsFromEnrichmentSelectedRows() {
  const ui = SpreadsheetApp.getUi();
  const sh = getSheet_();

  const ranges = getSelectedRanges_(sh);
  if (!ranges.length) return ui.alert('No selection.');

  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 3) return ui.alert('No data rows.');

  const data = sh.getRange(1, 1, lastRow, lastCol).getValues();
  const rows = getSelectedRowsFromRanges_(ranges, lastRow, 3);

  const result = runEnrichmentBackfill_(sh, data, rows);
  ui.alert(`Done. Wrote: ${result.writes}, Skipped: ${result.skipped}, Errors: ${result.errors}`);
}

function backfillIntakeFieldsFromEnrichmentAllRows() {
  const ui = SpreadsheetApp.getUi();
  const sh = getSheet_();

  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 3) return ui.alert('No data rows.');

  const data = sh.getRange(1, 1, lastRow, lastCol).getValues();
  const rows = [];
  for (let r = 3; r <= lastRow; r++) rows.push(r);

  const result = runEnrichmentBackfill_(sh, data, rows);
  ui.alert(`Done. Wrote: ${result.writes}, Skipped: ${result.skipped}, Errors: ${result.errors}`);
}

function normalizeIndustrySelectedRows() {
  const ui = SpreadsheetApp.getUi();
  const sh = getSheet_();

  const ranges = getSelectedRanges_(sh);
  if (!ranges.length) return ui.alert('No selection.');

  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 3) return ui.alert('No data rows.');

  const data = sh.getRange(1, 1, lastRow, lastCol).getValues();
  const rows = getSelectedRowsFromRanges_(ranges, lastRow, 3);

  const result = runIndustryNormalization_(sh, data, rows);
  ui.alert(`Done. Updated: ${result.writes}, Skipped: ${result.skipped}, Errors: ${result.errors}`);
}

function normalizeIndustryAllRows() {
  const ui = SpreadsheetApp.getUi();
  const sh = getSheet_();

  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 3) return ui.alert('No data rows.');

  const data = sh.getRange(1, 1, lastRow, lastCol).getValues();
  const rows = [];
  for (let r = 3; r <= lastRow; r++) rows.push(r);

  const result = runIndustryNormalization_(sh, data, rows);
  ui.alert(`Done. Updated: ${result.writes}, Skipped: ${result.skipped}, Errors: ${result.errors}`);
}

function runIntakeBlueprint_(sh, data, rows) {
  const headers = data[0].map(normalizeHeader_);
  const tCol = headers.findIndex(h => String(h).toUpperCase() === 'TRANSCRIPT');
  const bpCol = ensureColumn_(sh, headers, INTAKE_OUTPUT_HEADERS.BLUEPRINT);

  if (tCol === -1) throw new Error('Missing TRANSCRIPT header');

  let writes = 0;
  let skipped = 0;
  let errors = 0;

  for (const r of rows) {
    const row = data[r - 1] || [];
    const transcript = String(row[tCol] || '').trim();
    if (!transcript) {
      skipped++;
      continue;
    }

    const existingBlueprint = String(row[bpCol] || '').trim();
    if (existingBlueprint) {
      skipped++;
      continue;
    }

    try {
      const blueprint = callOpenAIIntakeBlueprint_(transcript);
      const writeCount = writeIfBlank_(sh, row, r, bpCol, normalizeBlueprintValue_(blueprint));
      data[r - 1] = row;

      if (!writeCount) {
        skipped++;
        continue;
      }

      writes++;
      Utilities.sleep(OPENAI_CFG.SLEEP_MS);
    } catch (e) {
      sh.getRange(r, bpCol + 1).setValue('ERROR: ' + e.message);
      errors++;
    }
  }

  return { writes, skipped, errors };
}

function runIntakeCombined_(sh, data, rows) {
  const blueprintResult = runIntakeBlueprint_(sh, data, rows);
  const fieldsResult = runIntakeFields_(sh, data, rows);

  return {
    writes: blueprintResult.writes + fieldsResult.writes,
    skipped: blueprintResult.skipped + fieldsResult.skipped,
    errors: blueprintResult.errors + fieldsResult.errors,
  };
}

function runEnrichmentBackfill_(sh, data, rows) {
  const headers = data[0].map(normalizeHeader_);
  const emailCol = findColumn_(headers, CFG.EMAIL_HEADER);
  const roleCol = findColumn_(headers, INTAKE_OUTPUT_HEADERS.ROLE);
  const companyCol = findColumn_(headers, INTAKE_OUTPUT_HEADERS.COMPANY);
  const industryCol = findColumn_(headers, INTAKE_OUTPUT_HEADERS.INDUSTRY);

  if (emailCol === -1) {
    throw new Error('Missing EMAIL header');
  }

  if (roleCol === -1 && companyCol === -1 && industryCol === -1) {
    return { writes: 0, skipped: rows.length, errors: 0 };
  }

  const lookup = loadEnrichmentLookup_();
  let writes = 0;
  let skipped = 0;
  let errors = 0;

  for (const r of rows) {
    const row = data[r - 1] || [];
    const email = String(row[emailCol] || '').trim().toLowerCase();
    if (!email) {
      skipped++;
      continue;
    }

    const match = lookup[email];
    if (!match) {
      skipped++;
      continue;
    }

    try {
      const writeCount = writeIntakeFields_(sh, data, r, {
        roleCol,
        companyCol,
        industryCol,
      }, {
        role: match.role,
        company: match.company,
        industry: match.industry,
      });

      if (!writeCount) {
        skipped++;
        continue;
      }

      writes++;
    } catch (e) {
      const targetCol = firstExistingColumn_(roleCol, companyCol, industryCol, emailCol);
      sh.getRange(r, targetCol + 1).setValue('ERROR: ' + e.message);
      errors++;
    }
  }

  return { writes, skipped, errors };
}

function runIndustryNormalization_(sh, data, rows) {
  const headers = data[0].map(normalizeHeader_);
  const industryCol = findColumn_(headers, INTAKE_OUTPUT_HEADERS.INDUSTRY);

  if (industryCol === -1) {
    throw new Error('Missing INDUSTRY header');
  }

  let writes = 0;
  let skipped = 0;
  let errors = 0;

  for (const r of rows) {
    const row = data[r - 1] || [];
    const current = String(row[industryCol] || '').trim();
    if (!current) {
      skipped++;
      continue;
    }

    try {
      const normalized = normalizeIndustryValue_(current);
      if (!normalized || normalized === current) {
        skipped++;
        continue;
      }

      sh.getRange(r, industryCol + 1).setValue(normalized);
      row[industryCol] = normalized;
      data[r - 1] = row;
      writes++;
    } catch (e) {
      sh.getRange(r, industryCol + 1).setValue('ERROR: ' + e.message);
      errors++;
    }
  }

  return { writes, skipped, errors };
}

function runIntakeFields_(sh, data, rows) {
  const headers = data[0].map(normalizeHeader_);
  const tCol = headers.findIndex(h => String(h).toUpperCase() === 'TRANSCRIPT');
  const roleCol = findColumn_(headers, INTAKE_OUTPUT_HEADERS.ROLE);
  const companyCol = findColumn_(headers, INTAKE_OUTPUT_HEADERS.COMPANY);
  const industryCol = findColumn_(headers, INTAKE_OUTPUT_HEADERS.INDUSTRY);

  if (tCol === -1) throw new Error('Missing TRANSCRIPT header');

  if (roleCol === -1 && companyCol === -1 && industryCol === -1) {
    return { writes: 0, skipped: rows.length, errors: 0 };
  }

  const errorCol = firstExistingColumn_(roleCol, companyCol, industryCol);

  let writes = 0;
  let skipped = 0;
  let errors = 0;

  for (const r of rows) {
    const row = data[r - 1] || [];
    const transcript = String(row[tCol] || '').trim();
    if (!transcript) {
      skipped++;
      continue;
    }

    const existingRole = String(row[roleCol] || '').trim();
    const existingCompany = String(row[companyCol] || '').trim();
    const existingIndustry = String(row[industryCol] || '').trim();

    if (existingRole && existingCompany && existingIndustry) {
      skipped++;
      continue;
    }

    try {
      const fields = callOpenAIIntakeFields_(transcript);
      const writeCount = writeIntakeFields_(sh, data, r, {
        roleCol,
        companyCol,
        industryCol,
      }, fields);

      if (!writeCount) {
        skipped++;
        continue;
      }

      writes++;
      Utilities.sleep(OPENAI_CFG.SLEEP_MS);
    } catch (e) {
      sh.getRange(r, errorCol + 1).setValue('ERROR: ' + e.message);
      errors++;
    }
  }

  return { writes, skipped, errors };
}

function writeIntakeFields_(sh, data, rowNumber, cols, values) {
  const row = data[rowNumber - 1] || [];
  let writes = 0;

  writes += writeIfBlankIfColumnExists_(sh, row, rowNumber, cols.roleCol, normalizeExtractedFieldValue_(values.role));
  writes += writeIfBlankIfColumnExists_(sh, row, rowNumber, cols.companyCol, normalizeExtractedFieldValue_(values.company));
  writes += writeIfBlankIfColumnExists_(sh, row, rowNumber, cols.industryCol, normalizeIndustryValue_(values.industry));

  data[rowNumber - 1] = row;
  return writes;
}

function writeIfBlank_(sh, row, rowNumber, colIndex, value) {
  const existing = String(row[colIndex] || '').trim();
  if (existing) return 0;
  if (!String(value || '').trim()) return 0;

  sh.getRange(rowNumber, colIndex + 1).setValue(value);
  row[colIndex] = value;
  return 1;
}

function writeIfBlankIfColumnExists_(sh, row, rowNumber, colIndex, value) {
  if (colIndex === -1) return 0;
  return writeIfBlank_(sh, row, rowNumber, colIndex, value);
}

function normalizeBlueprintValue_(value) {
  const clean = String(value || '').trim();
  if (!clean) return 'Not specified';
  return clean;
}

function normalizeExtractedFieldValue_(value) {
  const clean = String(value || '').trim();
  if (!clean) return '';

  const lowered = clean.toLowerCase();
  const bannedValues = new Set(['not specified', 'unknown', 'n/a', 'na', 'none']);
  if (bannedValues.has(lowered)) return '';

  return clean;
}

function normalizeIndustryValue_(value) {
  const clean = normalizeExtractedFieldValue_(value);
  if (!clean) return '';

  const normalized = clean
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[\/,]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return '';
  }

  if (
    normalized.includes('food') &&
    (
      normalized.includes('facility') ||
      normalized.includes('facilities') ||
      normalized.includes('workplace services')
    )
  ) {
    return 'Food & Facility Management Services';
  }

  if (
    normalized.includes('branding') ||
    normalized.includes('brand strategy') ||
    normalized.includes('marketing') ||
    normalized.includes('design consultancy') ||
    normalized.includes('creative agency') ||
    normalized.includes('advertising services') ||
    normalized.includes('media agency')
  ) {
    return 'Branding, Marketing & Design Consultancy';
  }

  if (
    normalized.includes('real estate') ||
    normalized.includes('property') ||
    normalized.includes('occupier') ||
    normalized.includes('commercial real estate')
  ) {
    return 'Real Estate';
  }

  if (
    normalized.includes('higher education') ||
    normalized.includes('university') ||
    normalized.includes('college') ||
    normalized.includes('school of public health') ||
    normalized.includes('executive education')
  ) {
    return 'Higher Education';
  }

  if (
    normalized.includes('technology') ||
    normalized.includes('information and internet') ||
    normalized.includes('information technology') ||
    normalized.includes('software') ||
    normalized.includes('semiconductor') ||
    normalized.includes('saas') ||
    normalized.includes('internet')
  ) {
    return 'Technology';
  }

  if (
    normalized.includes('consulting') ||
    normalized.includes('advisory') ||
    normalized.includes('professional services') ||
    normalized.includes('corporate advisory') ||
    normalized.includes('think tank')
  ) {
    return 'Consulting & Advisory';
  }

  if (
    normalized.includes('medtech') ||
    normalized.includes('medical device') ||
    normalized.includes('health technology') ||
    normalized.includes('assistive technology')
  ) {
    return 'MedTech';
  }

  if (
    normalized.includes('healthcare') ||
    normalized.includes('hospital') ||
    normalized.includes('health system')
  ) {
    return 'Healthcare';
  }

  if (normalized.includes('finance') || normalized.includes('fintech')) {
    return 'Financial Services';
  }

  if (
    normalized.includes('insurance')
  ) {
    return 'Insurance';
  }

  if (normalized.includes('accounting')) {
    return 'Accounting';
  }

  if (
    normalized.includes('manufacturing') ||
    normalized.includes('industrial')
  ) {
    return 'Manufacturing';
  }

  if (
    normalized.includes('retail') ||
    normalized.includes('ecommerce') ||
    normalized.includes('consumer goods')
  ) {
    return 'Retail';
  }

  return toTitleCaseIndustry_(clean);
}

function toTitleCaseIndustry_(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, match => match.toUpperCase());
}

function callOpenAIIntakeBlueprint_(transcript) {
  const instructions =
    INTAKE_BLUEPRINT_SYSTEM_PROMPT +
    '\n\n==================================================\n' +
    'EXECUTIVE PROFILE TEMPLATE (FOLLOW EXACTLY)\n' +
    EXEC_PROFILE_TEMPLATE +
    '\n\nReturn ONLY strict JSON matching the schema.';

  const schema = {
    type: 'object',
    additionalProperties: false,
    required: ['blueprint'],
    properties: {
      blueprint: {
        type: 'string',
        description: 'Executive profile text. Must follow the provided template exactly. No extra sections.',
      },
    },
  };

  const payload = {
    model: INTAKE_MODEL,
    instructions,
    input: transcript,
    store: false,
    reasoning: { effort: 'high' },
    text: {
      verbosity: 'low',
      format: {
        type: 'json_schema',
        name: 'intake_blueprint',
        strict: true,
        schema,
      },
    },
  };

  const res = UrlFetchApp.fetch(INTAKE_API_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: `Bearer ${secret_('OPENAI_API_KEY')}` },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  if (res.getResponseCode() >= 300) {
    const txt = res.getContentText();
    let msg = 'OpenAI error';
    try { msg = JSON.parse(txt)?.error?.message || msg; } catch (_) { }
    throw new Error(msg);
  }

  const json = JSON.parse(res.getContentText());
  const raw = extractText_(json);

  let obj;
  try {
    obj = JSON.parse(raw);
  } catch (e) {
    throw new Error('Structured output JSON.parse failed: ' + e.message + ' | raw=' + String(raw).slice(0, 200));
  }

  if (!obj || typeof obj !== 'object') throw new Error('Structured output missing object');
  return normalizeBlueprintValue_(obj.blueprint);
}

function callOpenAIIntakeFields_(transcript) {
  const payload = buildIntakeFieldsPayload_(transcript);
  const json = fetchIntakeJson_(payload);
  const raw = extractText_(json);

  let obj;
  try {
    obj = JSON.parse(raw);
  } catch (e) {
    throw new Error('Structured output JSON.parse failed: ' + e.message + ' | raw=' + String(raw).slice(0, 200));
  }

  if (!obj || typeof obj !== 'object') throw new Error('Structured output missing object');

  return {
    role: normalizeExtractedFieldValue_(obj.role),
    company: normalizeExtractedFieldValue_(obj.company),
    industry: normalizeIndustryValue_(obj.industry),
  };
}

function buildIntakeFieldsPayload_(transcript) {
  const schema = {
    type: 'object',
    additionalProperties: false,
    required: ['role', 'company', 'industry'],
    properties: {
      role: {
        type: 'string',
        description: 'Current role or job title only when explicitly stated. Otherwise return an empty string.',
      },
      company: {
        type: 'string',
        description: 'Current company or organization only when explicitly named. Otherwise return an empty string.',
      },
      industry: {
        type: 'string',
        description: 'Current industry or sector only when explicitly stated. Otherwise return an empty string.',
      },
    },
  };

  return {
    model: INTAKE_MODEL,
    instructions: INTAKE_FIELDS_SYSTEM_PROMPT,
    input: transcript,
    store: false,
    reasoning: { effort: 'high' },
    text: {
      verbosity: 'low',
      format: {
        type: 'json_schema',
        name: 'intake_fields',
        strict: true,
        schema,
      },
    },
  };
}

function fetchIntakeJson_(payload) {
  const res = UrlFetchApp.fetch(INTAKE_API_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: `Bearer ${secret_('OPENAI_API_KEY')}` },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  if (res.getResponseCode() >= 300) {
    const txt = res.getContentText();
    let msg = 'OpenAI error';
    try { msg = JSON.parse(txt)?.error?.message || msg; } catch (_) { }
    throw new Error(msg);
  }

  return JSON.parse(res.getContentText());
}

function loadEnrichmentLookup_() {
  const spreadsheetId = String(
    PropertiesService.getScriptProperties().getProperty(
      ENRICHMENT_BACKFILL_CFG.SPREADSHEET_ID_PROPERTY,
    ) || '',
  ).trim();

  if (!spreadsheetId) {
    throw new Error(
      `Missing Script Property: ${ENRICHMENT_BACKFILL_CFG.SPREADSHEET_ID_PROPERTY}`,
    );
  }

  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const requestedSheetName = String(
    PropertiesService.getScriptProperties().getProperty(
      ENRICHMENT_BACKFILL_CFG.SHEET_NAME_PROPERTY,
    ) || '',
  ).trim();

  const sheet = requestedSheetName
    ? spreadsheet.getSheetByName(requestedSheetName)
    : spreadsheet.getSheets()[0];

  if (!sheet) {
    throw new Error('Enrichment sheet not found');
  }

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    throw new Error('Enrichment sheet has no data');
  }

  const headerInfo = findEnrichmentHeaderRow_(values);
  if (!headerInfo) {
    throw new Error('Enrichment sheet is missing Email header');
  }

  const headerRowIndex = headerInfo.headerRowIndex;
  const headers = headerInfo.headers;
  const emailCol = findColumn_(headers, ENRICHMENT_BACKFILL_CFG.EMAIL_HEADER);
  const roleCol = findColumn_(headers, ENRICHMENT_BACKFILL_CFG.ROLE_HEADER);
  const companyCol = findColumn_(headers, ENRICHMENT_BACKFILL_CFG.COMPANY_HEADER);
  const industryCol = findColumn_(headers, ENRICHMENT_BACKFILL_CFG.INDUSTRY_HEADER);

  if (emailCol === -1) {
    throw new Error('Enrichment sheet is missing Email header');
  }

  const lookup = {};

  for (let r = headerRowIndex + 1; r < values.length; r++) {
    const row = values[r] || [];
    const email = String(row[emailCol] || '').trim().toLowerCase();
    if (!email) {
      continue;
    }

    const current = lookup[email] || { role: '', company: '', industry: '' };
    const next = {
      role: normalizeEnrichmentFieldValue_(row[roleCol]),
      company: normalizeEnrichmentFieldValue_(row[companyCol]),
      industry: normalizeIndustryValue_(row[industryCol]),
    };

    lookup[email] = {
      role: current.role || next.role,
      company: current.company || next.company,
      industry: current.industry || next.industry,
    };
  }

  return lookup;
}

function findEnrichmentHeaderRow_(values) {
  const maxRowsToScan = Math.min(values.length, 10);

  for (let rowIndex = 0; rowIndex < maxRowsToScan; rowIndex++) {
    const row = values[rowIndex] || [];
    const headers = row.map(normalizeHeader_);
    const emailCol = findColumn_(headers, ENRICHMENT_BACKFILL_CFG.EMAIL_HEADER);

    if (emailCol === -1) {
      continue;
    }

    return {
      headerRowIndex: rowIndex,
      headers,
    };
  }

  return null;
}

function normalizeEnrichmentFieldValue_(value) {
  const clean = String(value || '').trim();
  if (!clean) return '';

  const lowered = clean.toLowerCase();
  const bannedValues = new Set(['-', '—', '–', 'not specified', 'unknown', 'n/a', 'na']);
  if (bannedValues.has(lowered)) return '';

  return clean;
}

function compileCourseInstructionTemplate_(template) {
  let compiled = String(template || '');
  if (!compiled.trim()) {
    return '';
  }

  compiled = compiled.replace(/^\s*```[\w-]*\s*$/gm, '');
  compiled = compiled.replace(/\[\[\s*([\s\S]*?)\s*\]\]/g, (_, inner) => {
    const clean = normalizeInferredInstructionText_(inner);
    if (!clean) {
      return '';
    }

    return `[INFERRED: ${clean}]`;
  });

  return compiled.trim();
}

function normalizeInferredInstructionText_(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

// =========================
// OPENAI HELPERS
// =========================
function extractText_(resp) {
  if (!resp?.output) return '';
  const chunks = [];
  for (const item of resp.output) {
    if (item?.type === 'message' && item?.role === 'assistant') {
      for (const c of item.content || []) {
        if (c?.type === 'output_text') chunks.push(c.text);
      }
    }
  }
  return chunks.join('\n').trim();
}

function ensureColumn_(sh, headers, headerName) {
  const existingIndex = headers.findIndex(h => String(h).toUpperCase() === String(headerName).toUpperCase());
  if (existingIndex !== -1) return existingIndex;

  const newCol = headers.length + 1;
  sh.getRange(1, newCol).setValue(headerName);
  headers.push(headerName);
  return newCol - 1;
}

function findColumn_(headers, headerName) {
  return headers.findIndex(h => String(h).toUpperCase() === String(headerName).toUpperCase());
}

function firstExistingColumn_() {
  for (let i = 0; i < arguments.length; i++) {
    if (arguments[i] !== -1) return arguments[i];
  }

  return -1;
}

function rowToVars_(headers, rowVals) {
  const vars = {};

  for (let c = 0; c < headers.length; c++) {
    const header = headers[c];
    if (!header) continue;

    const value = String(rowVals[c] || '').trim();
    if (!(header in vars)) {
      vars[header] = value;
      continue;
    }

    if (!vars[header] && value) {
      vars[header] = value;
    }
  }

  return vars;
}

function interpolate_(template, vars) {
  const norm = k => String(k || '').toUpperCase().replace(/[\s\u00A0]/g, '');
  const normVars = {};
  for (const [k, v] of Object.entries(vars || {})) normVars[norm(k)] = v;

  return String(template || '').replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, p) => {
    const val = normVars[norm(p.trim())];
    return val !== undefined && String(val).trim() ? String(val) : `{{${p.trim()}}}`;
  });
}
