/**
 * s3.gs
 */

const SHEET_ID = "1I-LBWz9B-1g1HWxX5mVHM_43T13prxzFEZvXCZkZakk";
const TAB_NAME = "Inbox";
const LATEST_PUBLIC_TAB_NAME = "AILA 5";
const COHORT_CODES_PROPERTY = "Cohort Codes";

const S3_NOTION_CFG = {
  API_URL: "https://api.notion.com/v1",
  API_KEY_PROPERTY: "NOTION_API_KEY",
  DATABASE_ID_PROPERTY: "NOTION_DATABASE_ID",
  DATA_SOURCE_ID_PROPERTY: "NOTION_DATA_SOURCE_ID",
  DEFAULT_DATABASE_ID: "d3157a005df24c889a6be339e4b2cefe",
  VERSION: "2026-03-11",
  PAGE_SIZE: 100,
  EMAIL_PROPERTY: "Email",
  COHORT_CODES_PROPERTY,
};

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
    const tabName = resolveTranscriptTabName_(body, email);
    const sh = ensureTranscriptSheet_(ss, tabName);
    if (!sh) return json_({ ok: false, error: "tab_not_found", tab: tabName });

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
    return json_({ ok: true, tab: sh.getName(), row: sh.getLastRow() });
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

function resolveTranscriptTabName_(body, email) {
  const explicit = resolveCohortTabName_(body && body.cohort);
  if (explicit) return explicit;

  const notionCodes = lookupNotionCohortCodesByEmail_(email);
  return resolveCohortTabName_(notionCodes) || TAB_NAME;
}

function resolveCohortTabName_(value) {
  const codes = parseCohortCodes_(value);
  if (!codes.length) return "";

  const latestAila = pickLatestAilaCohort_(codes);
  if (latestAila) return latestAila;

  for (const code of codes) {
    const normalized = normalizePrivateCohortCode_(code);
    if (normalized) return normalized;
  }

  return "";
}

function parseCohortCodes_(value) {
  if (Array.isArray(value)) {
    return value.flatMap(parseCohortCodes_);
  }

  return String(value || "")
    .split(/[,;/|]+/)
    .map(code => code.trim())
    .filter(Boolean)
    .filter(code => !/^(null|undefined|default|public|latest)$/i.test(code));
}

function pickLatestAilaCohort_(codes) {
  let latest = 0;

  for (const code of codes) {
    const match = String(code || "").match(/\bAILA\s*#?\s*(\d+)\b/i);
    if (!match) continue;
    latest = Math.max(latest, Number(match[1]));
  }

  return latest ? `AILA ${latest}` : "";
}

function normalizePrivateCohortCode_(code) {
  const clean = String(code || "")
    .trim()
    .replace(/^#+/, "")
    .replace(/\s+/g, " ");
  if (!clean || /\bAILA\s*#?\s*\d+\b/i.test(clean)) return "";

  return clean
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .toUpperCase();
}

function ensureTranscriptSheet_(ss, tabName) {
  const existing = ss.getSheetByName(tabName);
  if (existing) return existing;

  if (tabName === TAB_NAME) return null;

  const sh = ss.insertSheet(tabName);
  const template = ss.getSheetByName(LATEST_PUBLIC_TAB_NAME) || ss.getSheetByName(TAB_NAME);
  if (!template) return sh;

  const rowsToCopy = Math.min(2, template.getLastRow());
  const colsToCopy = template.getLastColumn();
  if (rowsToCopy < 1 || colsToCopy < 1) return sh;

  const templateValues = template.getRange(1, 1, rowsToCopy, colsToCopy).getValues();
  sh.getRange(1, 1, rowsToCopy, colsToCopy).setValues(templateValues);
  return sh;
}

function lookupNotionCohortCodesByEmail_(email) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!cleanEmail) return "";

  try {
    const databaseId = getS3NotionDatabaseId_();
    const dataSourceId = getS3NotionDataSourceId_(databaseId);
    let startCursor = "";

    do {
      const payload = {
        page_size: S3_NOTION_CFG.PAGE_SIZE,
        filter: {
          property: S3_NOTION_CFG.EMAIL_PROPERTY,
          email: { equals: cleanEmail },
        },
      };
      if (startCursor) payload.start_cursor = startCursor;

      const json = fetchS3NotionJson_(
        `${S3_NOTION_CFG.API_URL}/data_sources/${encodeURIComponent(dataSourceId)}/query`,
        "post",
        payload,
      );

      for (const page of json.results || []) {
        const props = page.properties || {};
        const pageEmail = normalizeS3NotionPropertyText_(
          props[S3_NOTION_CFG.EMAIL_PROPERTY],
        ).toLowerCase();
        if (pageEmail !== cleanEmail) continue;

        return normalizeS3NotionPropertyText_(
          props[S3_NOTION_CFG.COHORT_CODES_PROPERTY],
        );
      }

      startCursor = json.has_more ? String(json.next_cursor || "") : "";
    } while (startCursor);
  } catch (err) {
    Logger.log(`Notion cohort lookup failed for ${cleanEmail}: ${String(err)}`);
  }

  return "";
}

function getS3NotionDatabaseId_() {
  const fromProperty = String(
    PropertiesService.getScriptProperties().getProperty(
      S3_NOTION_CFG.DATABASE_ID_PROPERTY,
    ) || "",
  ).trim();

  return normalizeS3NotionId_(fromProperty || S3_NOTION_CFG.DEFAULT_DATABASE_ID);
}

function getS3NotionDataSourceId_(databaseId) {
  const fromProperty = String(
    PropertiesService.getScriptProperties().getProperty(
      S3_NOTION_CFG.DATA_SOURCE_ID_PROPERTY,
    ) || "",
  ).trim();

  if (fromProperty) return normalizeS3NotionId_(fromProperty);

  const database = fetchS3NotionJson_(
    `${S3_NOTION_CFG.API_URL}/databases/${encodeURIComponent(databaseId)}`,
    "get",
  );
  const dataSourceId = database && database.data_sources && database.data_sources[0]?.id;

  if (!dataSourceId) {
    throw new Error("Notion database has no accessible data source");
  }

  return normalizeS3NotionId_(dataSourceId);
}

function fetchS3NotionJson_(url, method, payload) {
  const token = PropertiesService.getScriptProperties().getProperty(
    S3_NOTION_CFG.API_KEY_PROPERTY,
  );
  if (!token) throw new Error(`Missing Script Property: ${S3_NOTION_CFG.API_KEY_PROPERTY}`);

  const options = {
    method,
    contentType: "application/json",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": S3_NOTION_CFG.VERSION,
    },
    muteHttpExceptions: true,
  };

  if (payload) options.payload = JSON.stringify(payload);

  const res = UrlFetchApp.fetch(url, options);
  const text = res.getContentText();
  let json = {};
  try {
    json = JSON.parse(text);
  } catch (_) { }

  if (res.getResponseCode() >= 300) {
    throw new Error(json?.message || `Notion error ${res.getResponseCode()}`);
  }

  return json;
}

function normalizeS3NotionId_(value) {
  const clean = String(value || "").trim();
  if (!clean) return "";

  const uuidMatch = clean.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (uuidMatch) return uuidMatch[0];

  const compactMatch = clean.match(/[0-9a-f]{32}/i);
  if (compactMatch) return compactMatch[0];

  return clean;
}

function normalizeS3NotionPropertyText_(property) {
  if (!property) return "";

  switch (property.type) {
    case "title":
      return joinS3NotionRichText_(property.title);
    case "rich_text":
      return joinS3NotionRichText_(property.rich_text);
    case "email":
      return String(property.email || "").trim();
    case "select":
      return String(property.select?.name || "").trim();
    case "status":
      return String(property.status?.name || "").trim();
    case "multi_select":
      return (property.multi_select || [])
        .map(option => String(option?.name || "").trim())
        .filter(Boolean)
        .join(", ");
    default:
      return "";
  }
}

function joinS3NotionRichText_(items) {
  return (items || [])
    .map(item => String(item?.plain_text || "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();
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
