/**
 * notion_sync.gs
 * Field-specific profile sync from Notion enrichment into the active sheet.
 */

const NOTION_PROFILE_SYNC_HEADERS = {
  NAME: 'NAME',
  ROLE: 'ROLE',
  COMPANY: 'COMPANY',
  INDUSTRY: 'INDUSTRY',
};

const NOTION_PROFILE_SYNC_FIELDS = {
  name: {
    label: 'Full Name',
    header: NOTION_PROFILE_SYNC_HEADERS.NAME,
    replaceExisting: true,
    normalize(value) {
      return normalizeExtractedFieldValue_(value);
    },
  },
  role: {
    label: 'ROLE',
    header: NOTION_PROFILE_SYNC_HEADERS.ROLE,
    replaceExisting: false,
    normalize(value) {
      return normalizeExtractedFieldValue_(value);
    },
  },
  company: {
    label: 'COMPANY',
    header: NOTION_PROFILE_SYNC_HEADERS.COMPANY,
    replaceExisting: false,
    normalize(value) {
      return normalizeExtractedFieldValue_(value);
    },
  },
  industry: {
    label: 'INDUSTRY',
    header: NOTION_PROFILE_SYNC_HEADERS.INDUSTRY,
    replaceExisting: false,
    normalize(value) {
      return normalizeIndustryValue_(value);
    },
  },
};

function syncNotionNameSelectedRows() {
  return syncNotionProfileFieldSelectedRows_('name');
}

function syncNotionNameAllRows() {
  return syncNotionProfileFieldAllRows_('name');
}

function syncNotionRoleSelectedRows() {
  return syncNotionProfileFieldSelectedRows_('role');
}

function syncNotionRoleAllRows() {
  return syncNotionProfileFieldAllRows_('role');
}

function syncNotionCompanySelectedRows() {
  return syncNotionProfileFieldSelectedRows_('company');
}

function syncNotionCompanyAllRows() {
  return syncNotionProfileFieldAllRows_('company');
}

function syncNotionIndustrySelectedRows() {
  return syncNotionProfileFieldSelectedRows_('industry');
}

function syncNotionIndustryAllRows() {
  return syncNotionProfileFieldAllRows_('industry');
}

function syncNotionProfileFieldSelectedRows_(fieldKey) {
  const ui = SpreadsheetApp.getUi();
  const sh = getSheet_();
  const field = getNotionProfileSyncField_(fieldKey);

  const ranges = getSelectedRanges_(sh);
  if (!ranges.length) return ui.alert('No selection.');

  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 3) return ui.alert('No data rows.');

  const data = sh.getRange(1, 1, lastRow, lastCol).getValues();
  const rows = getSelectedRowsFromRanges_(ranges, lastRow, 3);

  const result = runNotionProfileFieldSync_(sh, data, rows, fieldKey);
  ui.alert(`Done syncing ${field.label}. Wrote: ${result.writes}, Skipped: ${result.skipped}, Errors: ${result.errors}`);
}

function syncNotionProfileFieldAllRows_(fieldKey) {
  const ui = SpreadsheetApp.getUi();
  const sh = getSheet_();
  const field = getNotionProfileSyncField_(fieldKey);

  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 3) return ui.alert('No data rows.');

  const data = sh.getRange(1, 1, lastRow, lastCol).getValues();
  const rows = [];
  for (let r = 3; r <= lastRow; r++) rows.push(r);

  const result = runNotionProfileFieldSync_(sh, data, rows, fieldKey);
  ui.alert(`Done syncing ${field.label}. Wrote: ${result.writes}, Skipped: ${result.skipped}, Errors: ${result.errors}`);
}

function runNotionProfileFieldSync_(sh, data, rows, fieldKey) {
  const field = getNotionProfileSyncField_(fieldKey);
  const headers = data[0].map(normalizeHeader_);
  const emailCol = findColumn_(headers, CFG.EMAIL_HEADER);
  const targetCol = findColumn_(headers, field.header);

  if (emailCol === -1) {
    throw new Error('Missing EMAIL header');
  }

  if (targetCol === -1) {
    return { writes: 0, skipped: rows.length, errors: 0 };
  }

  const lookup = loadNotionEnrichmentLookup_();
  return writeNotionProfileFieldSync_(sh, data, rows, lookup, {
    emailCol,
    targetCol,
  }, fieldKey);
}

function writeNotionProfileFieldSync_(sh, data, rows, lookup, cols, fieldKey) {
  const field = getNotionProfileSyncField_(fieldKey);
  let writes = 0;
  let skipped = 0;
  let errors = 0;

  for (const r of rows) {
    const row = data[r - 1] || [];
    const email = String(row[cols.emailCol] || '').trim().toLowerCase();
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
      const value = field.normalize(match[fieldKey]);
      const writeCount = field.replaceExisting
        ? writeIfChangedIfColumnExists_(sh, row, r, cols.targetCol, value)
        : writeIfBlankIfColumnExists_(sh, row, r, cols.targetCol, value);
      data[r - 1] = row;

      if (!writeCount) {
        skipped++;
        continue;
      }

      writes++;
    } catch (e) {
      const targetCol = firstExistingColumn_(cols.targetCol, cols.emailCol);
      sh.getRange(r, targetCol + 1).setValue('ERROR: ' + e.message);
      errors++;
    }
  }

  return { writes, skipped, errors };
}

function getNotionProfileSyncField_(fieldKey) {
  const field = NOTION_PROFILE_SYNC_FIELDS[fieldKey];
  if (!field) throw new Error(`Unknown Notion sync field: ${fieldKey}`);
  return field;
}

function writeIfChangedIfColumnExists_(sh, row, rowNumber, colIndex, value) {
  if (colIndex === -1) return 0;

  const cleanValue = String(value || '').trim();
  if (!cleanValue) return 0;

  const existing = String(row[colIndex] || '').trim();
  if (existing === cleanValue) return 0;

  sh.getRange(rowNumber, colIndex + 1).setValue(cleanValue);
  row[colIndex] = cleanValue;
  return 1;
}
