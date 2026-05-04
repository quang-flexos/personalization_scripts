/**
 * s3.gs
 */

const SHEET_ID = "1I-LBWz9B-1g1HWxX5mVHM_43T13prxzFEZvXCZkZakk";
const TAB_NAME = "Inbox";

function doPost(e) {
  let lock;
  try {
    lock = LockService.getScriptLock();
    lock.waitLock(30000);

    const body = parseJson_((e && e.postData && e.postData.contents) || "{}");
    const secret =
      PropertiesService.getScriptProperties().getProperty("APPS_SCRIPT_SECRET");
    if (!secret || body.secret !== secret)
      return json_({ ok: false, error: "unauthorized" });

    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const completed =
      body.completed === true ||
      String(body.completed || "").toLowerCase() === "true";
    if (!email) return json_({ ok: false, error: "missing_email" });
    if (!completed)
      return json_({ ok: true, skipped: true, reason: "not_completed" });

    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sh = ss.getSheetByName(TAB_NAME);
    if (!sh) return json_({ ok: false, error: "tab_not_found", tab: TAB_NAME });

    const width = sh.getLastColumn();
    if (width < 1) return json_({ ok: false, error: "missing_header_row" });

    const header = sh.getRange(1, 1, 1, width).getValues()[0];
    const col = indexColumns_(header);

    for (const k of ["DATE", "NAME", "EMAIL", "TRANSCRIPT"]) {
      if (col[k] == null)
        return json_({ ok: false, error: "missing_column_" + k });
    }

    const row = new Array(width).fill("");
    row[col.DATE] = normalizeDate_(
      body.uploaded_at,
      ss.getSpreadsheetTimeZone(),
    );
    row[col.NAME] = String(body.name || "").trim();
    row[col.EMAIL] = email;
    row[col.TRANSCRIPT] = String(body.transcript || "");
    if (col.SESSION_ID != null)
      row[col.SESSION_ID] = String(body.session_id || "").trim();

    sh.appendRow(row);
    return json_({ ok: true, tab: TAB_NAME, row: sh.getLastRow() });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    if (lock) {
      try {
        lock.releaseLock();
      } catch (_) { }
    }
  }
}

function indexColumns_(header) {
  const map = {};
  header.forEach((h, i) => {
    const k = String(h || "")
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, "");
    if (k && map[k] == null) map[k] = i;
  });
  return {
    DATE: map.date,
    NAME: map.name,
    EMAIL: map.email,
    TRANSCRIPT: map.transcript,
    SESSION_ID: map.sessionid,
  };
}

function normalizeDate_(v, tz) {
  if (!v) return Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm:ss");
  if (Object.prototype.toString.call(v) === "[object Date]" && !isNaN(v)) {
    return Utilities.formatDate(v, tz, "yyyy-MM-dd HH:mm:ss");
  }
  const s = String(v).trim();
  const d = new Date(s);
  if (!isNaN(d)) return Utilities.formatDate(d, tz, "yyyy-MM-dd HH:mm:ss");
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.replace("T", " ").slice(0, 19);
  return Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm:ss");
}

function parseJson_(raw) {
  try {
    return JSON.parse(String(raw || "{}"));
  } catch (_) {
    return {};
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
