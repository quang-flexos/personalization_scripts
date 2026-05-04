/**
 * kit.gs
 * Kit ops + shared helpers + single menu
 */

// =========================
// CONFIG
// =========================
function secret_(k) {
  const v = PropertiesService.getScriptProperties().getProperty(k);
  if (!v) throw new Error("Missing Script Property: " + k);
  return v;
}

const CFG = {
  SHEET_NAME: "",
  EMAIL_HEADER: "EMAIL",
  ID_HEADER: "ID",
  COURSE_PREFIX: "COURSE_",
  GREEN_HEX: "#b7e1cd",
  SLEEP_MS: 120,
  DRY_RUN: false,
};

const STRONG_MODE = {
  ENABLED: true,
  MAX_CHARS: 80,
};

const labelLineRx =
  /^\s*(?:"|[-*•]\s+)?\s*[A-Z][A-Za-z0-9]*(?:\s+[A-Za-z0-9/]+){0,6}\s*(?:\(|:)/;

// =========================
// MENU
// =========================
function onOpen() {
  buildSpreadsheetMenus_();
}

function onInstall() {
  buildSpreadsheetMenus_();
}

function rebuildSpreadsheetMenus() {
  buildSpreadsheetMenus_();

  SpreadsheetApp.getUi().alert(
    [
      "Menu rebuild finished.",
      "",
      "If you still do not see the menus:",
      "1. Save the Apps Script project.",
      "2. Reload the spreadsheet tab.",
      "3. Confirm this bound script contains the latest kit.js and personalized_docs.js.",
    ].join("\n"),
  );
}

function buildSpreadsheetMenus_() {
  const ui = SpreadsheetApp.getUi();

  addMenuSafely_("Kit Ops", function () {
    ui.createMenu("Kit Ops")
      .addItem("Fill IDs for selected rows", "fillIdsForSelectedRows")
      .addItem("Fill IDs for ALL rows", "fillIdsForAllRows")
      .addSeparator()
      .addItem(
        "Sync selected rows + selected COURSE_ cols (HTML)",
        "syncSelectedRowsSelectedColsHtml",
      )
      .addItem(
        "Sync selected rows + ALL COURSE_ cols (HTML)",
        "syncSelectedRowsAllCourseColsHtml",
      )
      .addItem(
        "Sync ALL rows + ALL COURSE_ cols (HTML)",
        "syncAllRowsAllCourseColsHtml",
      )
      .addSeparator()
      .addItem(
        "Sync selected rows + selected COURSE_ cols (Value)",
        "syncSelectedRowsSelectedColsValue",
      )
      .addItem(
        "Sync selected rows + ALL COURSE_ cols (Value)",
        "syncSelectedRowsAllCourseColsValue",
      )
      .addItem(
        "Sync ALL rows + ALL COURSE_ cols (Value)",
        "syncAllRowsAllCourseColsValue",
      )
      .addToUi();
  });

  addMenuSafely_("OpenAI", function () {
    ui.createMenu("OpenAI")
      .addItem(
        "Generate selected rows + selected COURSE_ cols",
        "openaiGenerateSelectedRowsSelectedCourseCols",
      )
      .addItem(
        "Generate selected rows + ALL COURSE_ cols",
        "openaiGenerateSelectedRowsAllCourseCols",
      )
      .addSeparator()
      .addItem(
        "Create Batch: selected rows + selected COURSE_ cols",
        "openaiCreateBatchSelectedRowsSelectedCourseCols",
      )
      .addItem(
        "Create Batch: selected rows + ALL COURSE_ cols",
        "openaiCreateBatchSelectedRowsAllCourseCols",
      )
      .addItem("Check latest batch", "openaiCheckLatestBatch")
      .addItem("Import latest batch results", "openaiImportLatestBatchResults")
      .addToUi();
  });

  addMenuSafely_("Intake", function () {
    ui.createMenu("Intake")
      .addItem("Generate BLUEPRINT (selected rows)", "generateIntakeSelectedRows")
      .addItem("Generate BLUEPRINT (ALL missing)", "generateIntakeAllMissing")
      .addSeparator()
      .addItem(
        "Backfill ROLE/COMPANY/INDUSTRY (selected rows)",
        "backfillIntakeFieldsFromEnrichmentSelectedRows",
      )
      .addItem(
        "Backfill ROLE/COMPANY/INDUSTRY (ALL rows)",
        "backfillIntakeFieldsFromEnrichmentAllRows",
      )
      .addSeparator()
      .addItem(
        "Normalize INDUSTRY (selected rows)",
        "normalizeIndustrySelectedRows",
      )
      .addItem(
        "Normalize INDUSTRY (ALL rows)",
        "normalizeIndustryAllRows",
      )
      .addToUi();
  });

  addPersonalizedDocsMenuSafely_(ui);
}

function addMenuSafely_(menuName, addMenu) {
  try {
    addMenu();
  } catch (error) {
    Logger.log(`Failed to add ${menuName} menu: ${buildMenuLoadMessage_(error)}`);
  }
}

function addPersonalizedDocsMenuSafely_(ui) {
  if (typeof addPersonalizedDocsMenu_ !== "function") {
    Logger.log("Personalized Docs menu is unavailable: addPersonalizedDocsMenu_ is missing.");
    addPersonalizedDocsSetupMenu_(ui);
    return;
  }

  try {
    addPersonalizedDocsMenu_(ui);
  } catch (error) {
    Logger.log(`Failed to add Personalized Docs menu: ${buildMenuLoadMessage_(error)}`);
    addPersonalizedDocsSetupMenu_(ui);
  }
}

function addPersonalizedDocsSetupMenu_(ui) {
  ui.createMenu("Personalized Docs")
    .addItem("Setup check", "showPersonalizedDocsSetupAlert_")
    .addToUi();
}

function showPersonalizedDocsSetupAlert_() {
  SpreadsheetApp.getUi().alert(
    [
      "Personalized Docs could not load.",
      "",
      "Most common causes:",
      "1. personalized_docs.js was not pushed into the live Apps Script project.",
      "2. An older Personalized Docs file still exists, so Apps Script is loading duplicate top-level declarations.",
      "3. The deployed file has a syntax error, so Apps Script could not load it.",
      "",
      "Fix:",
      "1. Keep only one Personalized Docs file in Apps Script.",
      "2. Push the latest local source with clasp.",
      "3. Save the Apps Script project and reload the sheet.",
    ].join("\n"),
  );
}

function buildMenuLoadMessage_(error) {
  return String((error && error.message) || error || "Unknown error");
}

// =========================
// SHARED HELPERS
// =========================
function getSheet_() {
  const ss = SpreadsheetApp.getActive();
  return CFG.SHEET_NAME
    ? ss.getSheetByName(CFG.SHEET_NAME)
    : ss.getActiveSheet();
}

function normalizeHeader_(v) {
  return String(v || "")
    .replace(/\u00A0/g, " ")
    .trim();
}

function getSelectedRanges_(sheet) {
  const rl = sheet.getActiveRangeList();
  const ranges = rl ? rl.getRanges() : [];
  if (ranges.length) return ranges;
  const ar = sheet.getActiveRange();
  return ar ? [ar] : [];
}

function getSelectedRowsFromRanges_(ranges, maxRow, minRow) {
  const floor = minRow || 2;
  const rowSet = new Set();

  for (const rg of ranges) {
    const start = Math.max(floor, rg.getRow());
    const end = Math.min(maxRow, rg.getRow() + rg.getNumRows() - 1);
    for (let r = start; r <= end; r++) rowSet.add(r);
  }

  return Array.from(rowSet).sort((a, b) => a - b);
}

function getSelectedColsFromRanges_(ranges, maxCol) {
  const colSet = new Set();

  for (const rg of ranges) {
    const start = rg.getColumn();
    const end = Math.min(maxCol, rg.getColumn() + rg.getNumColumns() - 1);
    for (let c = start; c <= end; c++) colSet.add(c - 1); // 0-based
  }

  return Array.from(colSet).sort((a, b) => a - b);
}

function getSelectedCourseColsFromRanges_(ranges, maxCol, headers, prefix) {
  const p = prefix || CFG.COURSE_PREFIX;
  const colSet = new Set();

  for (const rg of ranges) {
    const start = rg.getColumn();
    const end = Math.min(maxCol, rg.getColumn() + rg.getNumColumns() - 1);
    for (let c = start; c <= end; c++) {
      const h = headers[c - 1] || "";
      if (h.startsWith(p)) colSet.add(c - 1);
    }
  }

  return Array.from(colSet).sort((a, b) => a - b);
}

function getAllCourseCols_(headers, prefix) {
  const p = prefix || CFG.COURSE_PREFIX;
  const cols = [];
  for (let c = 0; c < headers.length; c++) {
    if ((headers[c] || "").startsWith(p)) cols.push(c);
  }
  return cols;
}

// =========================
// 1) FILL ID FROM EMAIL
// =========================
function fillIdsForSelectedRows() {
  const sh = getSheet_();
  const data = sh.getDataRange().getValues();
  const ranges = getSelectedRanges_(sh);
  if (!ranges.length) throw new Error("No selection.");

  const rows = getSelectedRowsFromRanges_(ranges, data.length, 2);
  fillIds_(data, rows);
}

function fillIdsForAllRows() {
  const sh = getSheet_();
  const data = sh.getDataRange().getValues();
  const rows = [];
  for (let r = 2; r <= data.length; r++) rows.push(r);
  fillIds_(data, rows);
}

function fillIds_(data, rows) {
  const sh = getSheet_();
  const headers = data[0].map(normalizeHeader_);
  const emailCol = headers.indexOf(CFG.EMAIL_HEADER);
  const idCol = headers.indexOf(CFG.ID_HEADER);
  if (emailCol === -1 || idCol === -1)
    throw new Error("Missing EMAIL or ID header");

  for (const r of rows) {
    const row = data[r - 1];
    const email = String(row[emailCol] || "")
      .trim()
      .toLowerCase();
    const existingId = String(row[idCol] || "").trim();
    if (!email || existingId) continue;

    const id = lookupSubscriberIdV4_(email);
    if (id) sh.getRange(r, idCol + 1).setValue(id);
    Utilities.sleep(CFG.SLEEP_MS);
  }
}

// =========================
// 2) HTML SYNC TO KIT
// =========================
function syncSelectedRowsSelectedColsHtml() {
  const sh = getSheet_();
  const data = sh.getDataRange().getValues();
  const ranges = getSelectedRanges_(sh);
  if (!ranges.length) throw new Error("No selection.");

  const rows = getSelectedRowsFromRanges_(ranges, data.length, 2);
  const cols = getSelectedColsFromRanges_(ranges, data[0].length);

  runSyncHtml_(data, rows, cols);
}

function syncSelectedRowsAllCourseColsHtml() {
  const sh = getSheet_();
  const data = sh.getDataRange().getValues();
  const ranges = getSelectedRanges_(sh);
  if (!ranges.length) throw new Error("No selection.");

  const rows = getSelectedRowsFromRanges_(ranges, data.length, 2);
  runSyncHtml_(data, rows, null);
}

function syncAllRowsAllCourseColsHtml() {
  const sh = getSheet_();
  const data = sh.getDataRange().getValues();
  const rows = [];
  for (let r = 2; r <= data.length; r++) rows.push(r);
  runSyncHtml_(data, rows, null);
}

function runSyncHtml_(data, rows, selectedCols) {
  const sh = getSheet_();
  const headers = data[0].map(normalizeHeader_);
  const idCol = headers.indexOf(CFG.ID_HEADER);
  if (idCol === -1) throw new Error("Missing ID header");

  const courseCols = [];
  for (let c = 0; c < headers.length; c++) {
    if (headers[c].startsWith(CFG.COURSE_PREFIX)) {
      if (!selectedCols || selectedCols.includes(c)) courseCols.push(c);
    }
  }
  if (!courseCols.length) throw new Error("No COURSE_ columns found");

  const labelToKey = CFG.DRY_RUN ? {} : ensureKitFieldsV4_(headers, courseCols);
  const htmlCache = new Map();

  let syncCount = 0;

  for (const r of rows) {
    const row = data[r - 1];
    const id = String(row[idCol] || "").trim();
    if (!id || id.toLowerCase() === "id") continue;

    const fields = {};
    const syncedCols = [];

    for (const c of courseCols) {
      const val = String(row[c] || "").trim();
      if (!val) continue;

      const label = headers[c];
      const key = labelToKey[label];
      if (!key) continue;

      let html = htmlCache.get(val);
      if (!html) {
        html = formatEmailHtml_(val);
        htmlCache.set(val, html);
      }

      fields[key] = html;
      syncedCols.push(c);
    }

    if (!Object.keys(fields).length) continue;

    if (!CFG.DRY_RUN) updateSubscriberV4_(id, fields);
    for (const c of syncedCols)
      sh.getRange(r, c + 1).setBackground(CFG.GREEN_HEX);

    syncCount++;
    Utilities.sleep(CFG.SLEEP_MS);
  }

  Logger.log("Total synced (HTML): " + syncCount);
}

// =========================
// 3) VALUE SYNC TO KIT (NO HTML)
// =========================
function syncSelectedRowsSelectedColsValue() {
  const sh = getSheet_();
  const data = sh.getDataRange().getValues();
  const ranges = getSelectedRanges_(sh);
  if (!ranges.length) throw new Error("No selection.");

  const rows = getSelectedRowsFromRanges_(ranges, data.length, 2);
  const cols = getSelectedColsFromRanges_(ranges, data[0].length);

  runSyncValue_(data, rows, cols);
}

function syncSelectedRowsAllCourseColsValue() {
  const sh = getSheet_();
  const data = sh.getDataRange().getValues();
  const ranges = getSelectedRanges_(sh);
  if (!ranges.length) throw new Error("No selection.");

  const rows = getSelectedRowsFromRanges_(ranges, data.length, 2);
  runSyncValue_(data, rows, null);
}

function syncAllRowsAllCourseColsValue() {
  const sh = getSheet_();
  const data = sh.getDataRange().getValues();
  const rows = [];
  for (let r = 2; r <= data.length; r++) rows.push(r);
  runSyncValue_(data, rows, null);
}

function runSyncValue_(data, rows, selectedCols) {
  const sh = getSheet_();
  const headers = data[0].map(normalizeHeader_);
  const idCol = headers.indexOf(CFG.ID_HEADER);
  if (idCol === -1) throw new Error("Missing ID header");

  const courseCols = [];
  for (let c = 0; c < headers.length; c++) {
    if (headers[c].startsWith(CFG.COURSE_PREFIX)) {
      if (!selectedCols || selectedCols.includes(c)) courseCols.push(c);
    }
  }
  if (!courseCols.length) throw new Error("No COURSE_ columns found");

  const labelToKey = CFG.DRY_RUN ? {} : ensureKitFieldsV4_(headers, courseCols);

  for (const r of rows) {
    const row = data[r - 1];
    const id = String(row[idCol] || "").trim();
    if (!id || id.toLowerCase() === "id") continue;

    const fields = {};
    const syncedCols = [];

    for (const c of courseCols) {
      const val = String(row[c] || "").trim();
      if (!val) continue;

      const label = headers[c];
      const key = labelToKey[label];
      if (!key) continue;

      fields[key] = val;
      syncedCols.push(c);
    }

    if (!syncedCols.length) continue;

    if (!CFG.DRY_RUN) updateSubscriberV4_(id, fields);
    for (const c of syncedCols)
      sh.getRange(r, c + 1).setBackground(CFG.GREEN_HEX);

    Utilities.sleep(CFG.SLEEP_MS);
  }
}

// =========================
// HTML FORMATTER
// =========================
function formatEmailHtml_(plainText) {
  let raw = String(plainText || "")
    .replace(/\r\n/g, "\n")
    .trim();
  if (!raw) return "";

  raw = normalizeWrappedBulletBlock_(raw);

  const styles = {
    p: "margin:0 0 1.2em 0;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:16px;color:#000000;line-height:1.6;",
    ul: "margin:0 0 1.2em 0;padding-left:1.4em;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:16px;color:#353535;line-height:1.6;",
    li: "margin:0.35em 0;",
    highlight:
      "padding-top:0.1em;padding-bottom:0.1em;background-color:#e3fbcc;border-radius:3px",
  };

  const lines = raw.split("\n");
  const bulletRx = /^(\s*)[-*•]\s+(.*)$/;

  let html = "";
  let paraBuf = [];
  let listLevel = 0;

  function flushPara() {
    const text = paraBuf.join("\n").trim();
    paraBuf = [];
    if (!text) return;
    html += `<p style="${styles.p}"><span style="${styles.highlight}">${processLineForHtml_(text)}</span></p>`;
  }

  function closeListsTo(target) {
    while (listLevel > target) {
      html += "</li></ul>";
      listLevel--;
    }
  }

  function openListAt(level, contentHtml) {
    if (level > listLevel) {
      while (listLevel < level) {
        html += `<ul style="${styles.ul}"><li style="${styles.li}">`;
        listLevel++;
      }
      html += `<span style="${styles.highlight}">${contentHtml}</span>`;
      return;
    }

    if (level === listLevel) {
      html += `</li><li style="${styles.li}"><span style="${styles.highlight}">${contentHtml}</span>`;
      return;
    }

    closeListsTo(level);
    html += `</li><li style="${styles.li}"><span style="${styles.highlight}">${contentHtml}</span>`;
  }

  for (const rawLine of lines) {
    const line = String(rawLine || "").replace(/\s+$/, "");
    const trimmed = line.trim();

    if (!trimmed) {
      flushPara();
      closeListsTo(0);
      continue;
    }

    const bm = line.match(bulletRx);
    if (bm) {
      flushPara();

      const indentSpaces = bm[1].length;

      // Treat small copied indents as same-level bullets.
      // Only promote to nested level for clearly deeper indentation.
      const level =
        indentSpaces >= 4 ? Math.min(5, Math.floor(indentSpaces / 2) + 1) : 1;

      const content = bm[2].trim();
      openListAt(level, processLineForHtml_(content));
      continue;
    }

    closeListsTo(0);

    if (labelLineRx.test(trimmed)) {
      flushPara();
      html += `<p style="${styles.p}"><span style="${styles.highlight}">${processLineForHtml_(trimmed)}</span></p>`;
    } else {
      paraBuf.push(trimmed);
    }
  }

  flushPara();
  closeListsTo(0);

  return html;
}

function normalizeWrappedBulletBlock_(text) {
  let s = String(text || "")
    .replace(/\r\n/g, "\n")
    .trim();
  if (!s) return s;

  let lines = s.split("\n");

  // Remove standalone wrapper lines:
  // [
  // - item
  // ]
  if (
    lines.length >= 3 &&
    lines[0].trim() === "[" &&
    lines[lines.length - 1].trim() === "]"
  ) {
    lines = lines.slice(1, -1);
  } else {
    // Remove inline wrappers:
    // [- item
    //   - item
    //   - item.]
    lines[0] = lines[0].replace(/^\s*\[\s*/, "");
    lines[lines.length - 1] = lines[lines.length - 1].replace(/\s*\]\s*$/, "");
  }

  // If this is a bullet block, normalize shared indentation so copied
  // bullets do not become fake nested lists.
  const bulletIndents = lines
    .filter((line) => /^\s*[-*•]\s+/.test(line))
    .map((line) => (line.match(/^(\s*)/) || ["", ""])[1].length);

  if (bulletIndents.length) {
    const minIndent = Math.min.apply(null, bulletIndents);
    if (minIndent > 0) {
      lines = lines.map((line) =>
        line.startsWith(" ".repeat(minIndent)) ? line.slice(minIndent) : line,
      );
    }
  }

  return lines.join("\n").trim();
}

function processLineForHtml_(text) {
  const s = String(text || "");
  const decorated = applyStrongMarks_(s);
  const escaped = escapeHtmlPreservePlaceholders_(decorated);

  return escaped
    .replace(/\[\[STRONG_START\]\]/g, "<strong>")
    .replace(/\[\[STRONG_END\]\]/g, "</strong>")
    .replace(/\n/g, "<br>"); // convert preserved newlines to HTML breaks
}

function applyStrongMarks_(text) {
  let out = String(text || "");
  if (!out) return out;

  out = markBracketedText_(out);
  out = markLeadingLabel_(out);

  return out;
}

function markBracketedText_(text) {
  return String(text || "").replace(/\[([^[\]\n]+)\]/g, function (_, inner) {
    return "[" + strongWrap_(inner) + "]";
  });
}

function markLeadingLabel_(text) {
  const match = String(text || "").match(/^\s*([A-Za-z][^:\n]{1,80})(?=:\s)/);
  if (!match || !match[1]) return text;

  const label = match[1].trim();
  const start = text.indexOf(label);
  if (start === -1) return text;

  return (
    text.slice(0, start) + strongWrap_(label) + text.slice(start + label.length)
  );
}

function strongWrap_(text) {
  return "[[STRONG_START]]" + text + "[[STRONG_END]]";
}

function escapeHtmlPreservePlaceholders_(s) {
  const START = "%%STRONG_START%%";
  const END = "%%STRONG_END%%";

  const tmp = String(s)
    .replace(/\[\[STRONG_START\]\]/g, START)
    .replace(/\[\[STRONG_END\]\]/g, END);

  const esc = escapeHtml_(tmp);
  return esc
    .replace(new RegExp(START, "g"), "[[STRONG_START]]")
    .replace(new RegExp(END, "g"), "[[STRONG_END]]");
}

function escapeHtml_(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// =========================
// KIT V4 API
// =========================
function lookupSubscriberIdV4_(email) {
  const res = UrlFetchApp.fetch(
    "https://api.kit.com/v4/subscribers?email_address=" +
    encodeURIComponent(email),
    {
      headers: { "X-Kit-Api-Key": secret_("KIT_API_KEY") },
      muteHttpExceptions: true,
    },
  );
  if (res.getResponseCode() >= 300) return null;
  const json = JSON.parse(res.getContentText());
  return json.subscribers?.[0]?.id || null;
}

function ensureKitFieldsV4_(headers, courseCols) {
  const labels = [...new Set(courseCols.map((c) => headers[c]))];

  for (const label of labels) {
    UrlFetchApp.fetch("https://api.kit.com/v4/custom_fields", {
      method: "post",
      headers: {
        "X-Kit-Api-Key": secret_("KIT_API_KEY"),
        "Content-Type": "application/json",
      },
      payload: JSON.stringify({ label }),
      muteHttpExceptions: true,
    });
    Utilities.sleep(100);
  }

  const res = UrlFetchApp.fetch("https://api.kit.com/v4/custom_fields", {
    headers: { "X-Kit-Api-Key": secret_("KIT_API_KEY") },
    muteHttpExceptions: true,
  });

  const json = JSON.parse(res.getContentText());
  const fields = json.custom_fields || json.customFields || [];
  const map = {};
  for (const f of Array.isArray(fields) ? fields : fields.data || []) {
    if (f?.label && f?.key) map[f.label] = f.key;
  }
  return map;
}

function updateSubscriberV4_(id, fields) {
  UrlFetchApp.fetch(
    "https://api.kit.com/v4/subscribers/" + encodeURIComponent(id),
    {
      method: "put",
      headers: {
        "X-Kit-Api-Key": secret_("KIT_API_KEY"),
        "Content-Type": "application/json",
      },
      payload: JSON.stringify({ fields }),
      muteHttpExceptions: true,
    },
  );
}
