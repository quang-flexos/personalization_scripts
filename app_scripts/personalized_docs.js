/**
 * personalized_docs.js
 *
 * Deploy this file with clasp as part of the Apps Script project.
 *
 * The menu entry point still needs this line inside onOpen():
 *   addPersonalizedDocsMenu_(ui);
 */

// Use var here so Apps Script is less likely to fail at load time if this file
// is accidentally duplicated during a partial sync or update.
var PERSONALIZED_DOC_CFG = Object.freeze({
  DEFAULT_TEMPLATE_DOC_ID: '1Iku5BhwWC3KXMsn7HitAmzQBDBoUAoC7nvfnTKvUuA0',
  TEMPLATE_DOC_IDS_BY_SHEET: Object.freeze({
    'Catawiki SLT': '1HgYNoMBvFhPi5ix2QZILLIH-OFJcFWMcw4mnBK1esvI',
    'Supercell SLT': '1HgYNoMBvFhPi5ix2QZILLIH-OFJcFWMcw4mnBK1esvI',
  }),
  OPTIONAL_PREFLIGHT_HEADERS_BY_SHEET: Object.freeze({
    'Catawiki SLT': Object.freeze(['COMPANY', 'ROLE']),
    'Supercell SLT': Object.freeze(['COMPANY', 'ROLE']),
    'Serwiz': Object.freeze(['COMPANY', 'ROLE']),
  }),
  PARENT_FOLDER_ID: '1iBAZAAw8Q6AmDS_MU-y3-v2vRC_IHhu3',
  DOC_URL_HEADER: 'DOC_URL',
  PDF_URL_HEADER: 'PDF_URL',
  DELIVERY_STATUS_HEADER: 'DELIVERY_STATUS',
  KIT_FIELD_LABEL: 'PDF_URL',
  EMAIL_HEADER: 'EMAIL',
  TRANSCRIPT_HEADER: 'TRANSCRIPT',
  DATA_START_ROW: 3,
  REQUIRED_PROFILE_HEADERS: ['BLUEPRINT', 'ROLE', 'COMPANY', 'INDUSTRY'],
  READY_HEX: '#d9ead3',
  BLOCKED_HEX: '#f4cccc',
  ERROR_HEX: '#fce5cd',
  STATUS: {
    READY: 'READY',
    BLOCKED: 'BLOCKED',
    PLACEHOLDER_SYNCED: 'PLACEHOLDER_SYNCED',
    DOC_READY: 'DOC_READY',
    PDF_READY: 'PDF_READY',
    KIT_SYNCED: 'KIT_SYNCED',
    ERROR: 'ERROR',
  },
});

function addPersonalizedDocsMenu_(ui) {
  ui.createMenu('Personalized Docs')
    .addItem('Preflight selected rows', 'preflightPersonalizedDocsForSelection')
    .addItem('Preflight all rows', 'preflightPersonalizedDocsForAllRows')
    .addSeparator()
    .addItem('Build docs + PDFs for selected rows', 'buildPersonalizedDocsForSelection')
    .addItem('Build docs + PDFs for all rows', 'buildPersonalizedDocsForAllRows')
    .addSeparator()
    .addItem('Sync PDF links to Kit for selected rows', 'syncPersonalizedPdfLinksForSelection')
    .addItem('Sync PDF links to Kit for all rows', 'syncPersonalizedPdfLinksForAllRows')
    .addSeparator()
    .addItem('Run full delivery for selected rows', 'runFullPersonalizedDeliveryForSelection')
    .addItem('Run full delivery for all rows', 'runFullPersonalizedDeliveryForAllRows')
    .addToUi();
}

function preflightPersonalizedDocsForSelection() {
  pdRunMenuAction_(() => {
    const sheet = SpreadsheetApp.getActiveSheet();
    const rows = pdGetSelectedLearnerRows_(sheet);
    return pdRunPreflight_(sheet, rows);
  }, result =>
    `Preflight done.\nReady: ${result.ready}\nBlocked: ${result.blocked}\nSkipped: ${result.skipped}\nErrors: ${result.errors}`
  );
}

function preflightPersonalizedDocsForAllRows() {
  pdRunMenuAction_(() => {
    const sheet = SpreadsheetApp.getActiveSheet();
    const rows = pdGetAllLearnerRows_(sheet);
    return pdRunPreflight_(sheet, rows);
  }, result =>
    `Preflight done.\nReady: ${result.ready}\nBlocked: ${result.blocked}\nSkipped: ${result.skipped}\nErrors: ${result.errors}`
  );
}

function buildPersonalizedDocsForSelection() {
  pdRunMenuAction_(() => {
    const sheet = SpreadsheetApp.getActiveSheet();
    const rows = pdGetSelectedLearnerRows_(sheet);
    return pdRunDocAndPdfBuild_(sheet, rows);
  }, result =>
    `Build done.\nDocs created: ${result.createdDocs}\nDocs updated: ${result.updatedDocs}\nPDFs built: ${result.pdfsBuilt}\nBlocked: ${result.blocked}\nSkipped: ${result.skipped}\nErrors: ${result.errors}`
  );
}

function buildPersonalizedDocsForAllRows() {
  pdRunMenuAction_(() => {
    const sheet = SpreadsheetApp.getActiveSheet();
    const rows = pdGetAllLearnerRows_(sheet);
    return pdRunDocAndPdfBuild_(sheet, rows);
  }, result =>
    `Build done.\nDocs created: ${result.createdDocs}\nDocs updated: ${result.updatedDocs}\nPDFs built: ${result.pdfsBuilt}\nBlocked: ${result.blocked}\nSkipped: ${result.skipped}\nErrors: ${result.errors}`
  );
}

function syncPersonalizedPdfLinksForSelection() {
  pdRunMenuAction_(() => {
    const sheet = SpreadsheetApp.getActiveSheet();
    const rows = pdGetSelectedLearnerRows_(sheet);
    return pdRunPdfSync_(sheet, rows);
  }, result =>
    `Kit sync done.\nSynced: ${result.synced}\nBlocked: ${result.blocked}\nSkipped: ${result.skipped}\nErrors: ${result.errors}`
  );
}

function syncPersonalizedPdfLinksForAllRows() {
  pdRunMenuAction_(() => {
    const sheet = SpreadsheetApp.getActiveSheet();
    const rows = pdGetAllLearnerRows_(sheet);
    return pdRunPdfSync_(sheet, rows);
  }, result =>
    `Kit sync done.\nSynced: ${result.synced}\nBlocked: ${result.blocked}\nSkipped: ${result.skipped}\nErrors: ${result.errors}`
  );
}

function runFullPersonalizedDeliveryForSelection() {
  pdRunMenuAction_(() => {
    const sheet = SpreadsheetApp.getActiveSheet();
    const rows = pdGetSelectedLearnerRows_(sheet);
    return pdRunFullDelivery_(sheet, rows);
  }, result => pdBuildFullDeliveryMessage_(result));
}

function runFullPersonalizedDeliveryForAllRows() {
  pdRunMenuAction_(() => {
    const sheet = SpreadsheetApp.getActiveSheet();
    const rows = pdGetAllLearnerRows_(sheet);
    return pdRunFullDelivery_(sheet, rows);
  }, result => pdBuildFullDeliveryMessage_(result));
}

function pdRunFullDelivery_(sheet, rows) {
  const preflight = pdRunPreflight_(sheet, rows);
  const build = pdRunDocAndPdfBuild_(sheet, preflight.readyRows);
  const sync = pdRunPdfSync_(sheet, build.successfulRows);
  const placeholderRows = preflight.blockedRows || [];
  const placeholderSync = placeholderRows.length
    ? pdRunPlaceholderPdfSync_(sheet, placeholderRows, preflight.blockedRowMessages)
    : pdBuildEmptyPlaceholderSyncResult_();

  return { preflight, build, sync, placeholderSync };
}

function pdBuildFullDeliveryMessage_(result) {
  return [
    'Full delivery done.',
    '',
    `Preflight ready: ${result.preflight.ready}`,
    `Preflight blocked: ${result.preflight.blocked}`,
    '',
    `Docs created: ${result.build.createdDocs}`,
    `Docs updated: ${result.build.updatedDocs}`,
    `PDFs built: ${result.build.pdfsBuilt}`,
    `Build blocked: ${result.build.blocked}`,
    '',
    `Kit synced: ${result.sync.synced}`,
    `Sync blocked: ${result.sync.blocked}`,
    '',
    `Placeholder URLs created: ${result.placeholderSync.placeholdersCreated}`,
    `Placeholder URLs reused: ${result.placeholderSync.placeholdersReused}`,
    `Placeholder URLs synced to Kit: ${result.placeholderSync.synced}`,
    `Placeholder sync blocked: ${result.placeholderSync.blocked}`,
    `Total errors: ${result.preflight.errors + result.build.errors + result.sync.errors + result.placeholderSync.errors}`,
  ].join('\n');
}

function pdRunMenuAction_(runner, buildMessage) {
  const ui = SpreadsheetApp.getUi();

  try {
    const result = runner();
    ui.alert(buildMessage(result));
  } catch (error) {
    ui.alert(pdBuildRunErrorMessage_(error));
  }
}

function pdBuildRunErrorMessage_(error) {
  const message = String(error?.message || error || 'Unknown error');

  if (!/Access denied:\s*DriveApp\.?/i.test(message)) {
    return message;
  }

  return [
    'Google Drive blocked part of this step.',
    '',
    'Most common causes:',
    '1. The Apps Script project still needs Drive authorization.',
    '2. The script cannot access the template doc or destination folder.',
    '',
    'Next steps:',
    '1. Save the Apps Script project so the Drive scope in appsscript.json is active.',
    '2. Run the menu action again and accept the Google authorization prompt if Google shows one.',
    '3. If the prompt never appears, revoke the project access and authorize it again.',
    '4. Confirm the resolved template doc ID and PARENT_FOLDER_ID point to items this script can open.',
  ].join('\n');
}

function pdRunPreflight_(sheet, rows) {
  const context = pdLoadRunContext_(sheet, true);
  const statusCol = pdEnsureOutputColumn_(sheet, context.headers, PERSONALIZED_DOC_CFG.DELIVERY_STATUS_HEADER);

  let ready = 0;
  let blocked = 0;
  let skipped = 0;
  let errors = 0;
  const readyRows = [];
  const blockedRows = [];
  const blockedRowMessages = {};

  for (const rowNumber of rows) {
    const row = context.values[rowNumber - 1] || [];
    const email = pdGetHeaderValue_(context.headers, row, PERSONALIZED_DOC_CFG.EMAIL_HEADER);

    if (!email) {
      pdWriteStatus_(sheet, rowNumber, statusCol, PERSONALIZED_DOC_CFG.STATUS.BLOCKED, 'Missing EMAIL.');
      skipped++;
      continue;
    }

    try {
      const evaluation = pdEvaluateRowReadiness_(context, row);

      if (!evaluation.ready) {
        const blockerMessage = pdBuildBlockerMessage_(evaluation.blockers);
        pdWriteStatus_(
          sheet,
          rowNumber,
          statusCol,
          PERSONALIZED_DOC_CFG.STATUS.BLOCKED,
          blockerMessage
        );
        blocked++;
        blockedRows.push(rowNumber);
        blockedRowMessages[rowNumber] = blockerMessage;
        continue;
      }

      const currentStatus = pdGetHeaderValue_(context.headers, row, PERSONALIZED_DOC_CFG.DELIVERY_STATUS_HEADER);
      const nextStatus = pdPickReadyStatus_(currentStatus, context.headers, row);

      pdWriteStatus_(sheet, rowNumber, statusCol, nextStatus, 'Ready for Doc/PDF generation.');
      ready++;
      readyRows.push(rowNumber);
    } catch (error) {
      pdWriteStatus_(sheet, rowNumber, statusCol, PERSONALIZED_DOC_CFG.STATUS.ERROR, error.message);
      errors++;
    }
  }

  return { ready, blocked, skipped, errors, readyRows, blockedRows, blockedRowMessages };
}

function pdRunDocAndPdfBuild_(sheet, rows) {
  const context = pdLoadRunContext_(sheet, true);
  const docUrlCol = pdEnsureOutputColumn_(sheet, context.headers, PERSONALIZED_DOC_CFG.DOC_URL_HEADER);
  const pdfUrlCol = pdEnsureOutputColumn_(sheet, context.headers, PERSONALIZED_DOC_CFG.PDF_URL_HEADER);
  const statusCol = pdEnsureOutputColumn_(sheet, context.headers, PERSONALIZED_DOC_CFG.DELIVERY_STATUS_HEADER);
  const folder = pdEnsureTabFolder_(sheet.getName());

  let createdDocs = 0;
  let updatedDocs = 0;
  let pdfsBuilt = 0;
  let blocked = 0;
  let skipped = 0;
  let errors = 0;
  const successfulRows = [];

  for (const rowNumber of rows) {
    const row = context.values[rowNumber - 1] || [];

    try {
      const docResult = pdUpsertLearnerDoc_(context, row, folder);
      const pdfResult = pdUpsertLearnerPdf_(context.headers, row, docResult, folder);
      const evaluation = pdEvaluateRowReadiness_(context, row);
      const successMessage = pdBuildDocBuildMessage_(evaluation);

      sheet.getRange(rowNumber, docUrlCol + 1).setValue(docResult.url).setBackground(PERSONALIZED_DOC_CFG.READY_HEX);
      sheet.getRange(rowNumber, pdfUrlCol + 1).setValue(pdfResult.url).setBackground(PERSONALIZED_DOC_CFG.READY_HEX);
      pdWriteStatus_(sheet, rowNumber, statusCol, PERSONALIZED_DOC_CFG.STATUS.PDF_READY, successMessage);

      if (docResult.mode === 'created') {
        createdDocs++;
      } else {
        updatedDocs++;
      }

      pdfsBuilt++;
      successfulRows.push(rowNumber);
    } catch (error) {
      pdWriteStatus_(sheet, rowNumber, statusCol, PERSONALIZED_DOC_CFG.STATUS.ERROR, error.message);
      errors++;
    }
  }

  return { createdDocs, updatedDocs, pdfsBuilt, blocked, skipped, errors, successfulRows };
}

function pdRunPdfSync_(sheet, rows) {
  const context = pdLoadRunContext_(sheet, false);
  const pdfUrlCol = pdRequireColumn_(context.headers, PERSONALIZED_DOC_CFG.PDF_URL_HEADER);
  const statusCol = pdEnsureOutputColumn_(sheet, context.headers, PERSONALIZED_DOC_CFG.DELIVERY_STATUS_HEADER);
  const kitFieldKey = pdEnsureKitCustomFieldKey_(PERSONALIZED_DOC_CFG.KIT_FIELD_LABEL);

  let synced = 0;
  let blocked = 0;
  let skipped = 0;
  let errors = 0;

  for (const rowNumber of rows) {
    const row = context.values[rowNumber - 1] || [];
    const email = pdGetHeaderValue_(context.headers, row, PERSONALIZED_DOC_CFG.EMAIL_HEADER);
    const pdfUrl = String(row[pdfUrlCol] || '').trim();

    if (!email) {
      pdWriteStatus_(sheet, rowNumber, statusCol, PERSONALIZED_DOC_CFG.STATUS.BLOCKED, 'Missing EMAIL.');
      skipped++;
      continue;
    }

    if (!pdfUrl) {
      pdWriteStatus_(sheet, rowNumber, statusCol, PERSONALIZED_DOC_CFG.STATUS.BLOCKED, 'Missing PDF_URL.');
      blocked++;
      continue;
    }

    try {
      pdSyncValueToKit_(email, kitFieldKey, pdfUrl);
      pdWriteStatus_(sheet, rowNumber, statusCol, PERSONALIZED_DOC_CFG.STATUS.KIT_SYNCED, 'PDF link synced to Kit.');
      synced++;
    } catch (error) {
      pdWriteStatus_(sheet, rowNumber, statusCol, PERSONALIZED_DOC_CFG.STATUS.ERROR, error.message);
      errors++;
    }
  }

  return { synced, blocked, skipped, errors };
}

function pdRunPlaceholderPdfSync_(sheet, rows, blockerMessages) {
  if (!rows.length) {
    return pdBuildEmptyPlaceholderSyncResult_();
  }

  const context = pdLoadRunContext_(sheet, true);
  const docUrlCol = pdEnsureOutputColumn_(sheet, context.headers, PERSONALIZED_DOC_CFG.DOC_URL_HEADER);
  const pdfUrlCol = pdEnsureOutputColumn_(sheet, context.headers, PERSONALIZED_DOC_CFG.PDF_URL_HEADER);
  const statusCol = pdEnsureOutputColumn_(sheet, context.headers, PERSONALIZED_DOC_CFG.DELIVERY_STATUS_HEADER);
  const kitFieldKey = pdEnsureKitCustomFieldKey_(PERSONALIZED_DOC_CFG.KIT_FIELD_LABEL);
  const folder = pdEnsureTabFolder_(sheet.getName());

  let placeholdersCreated = 0;
  let placeholdersReused = 0;
  let synced = 0;
  let blocked = 0;
  let skipped = 0;
  let errors = 0;

  for (const rowNumber of rows) {
    const row = context.values[rowNumber - 1] || [];
    const email = pdGetHeaderValue_(context.headers, row, PERSONALIZED_DOC_CFG.EMAIL_HEADER);

    if (!email) {
      pdWriteStatus_(sheet, rowNumber, statusCol, PERSONALIZED_DOC_CFG.STATUS.BLOCKED, 'Missing EMAIL.');
      skipped++;
      continue;
    }

    try {
      let pdfUrl = pdGetHeaderValue_(context.headers, row, PERSONALIZED_DOC_CFG.PDF_URL_HEADER);
      const existingPdfFile = pdGetDriveFileIfAccessible_(pdTryExtractDriveFileIdFromUrl_(pdfUrl));
      const docResult = pdUpsertLearnerDoc_(context, row, folder);
      const pdfResult = pdUpsertLearnerPdf_(context.headers, row, docResult, folder);

      if (existingPdfFile) {
        placeholdersReused++;
      } else {
        placeholdersCreated++;
      }

      pdfUrl = pdfResult.url;
      sheet.getRange(rowNumber, docUrlCol + 1).setValue(docResult.url).setBackground(PERSONALIZED_DOC_CFG.READY_HEX);
      sheet.getRange(rowNumber, pdfUrlCol + 1).setValue(pdfUrl).setBackground(PERSONALIZED_DOC_CFG.READY_HEX);
      pdSyncValueToKit_(email, kitFieldKey, pdfUrl);
      pdWriteStatus_(
        sheet,
        rowNumber,
        statusCol,
        PERSONALIZED_DOC_CFG.STATUS.PLACEHOLDER_SYNCED,
        pdBuildPlaceholderSyncMessage_(blockerMessages && blockerMessages[rowNumber])
      );
      synced++;
    } catch (error) {
      pdWriteStatus_(sheet, rowNumber, statusCol, PERSONALIZED_DOC_CFG.STATUS.ERROR, error.message);
      errors++;
    }
  }

  return { placeholdersCreated, placeholdersReused, synced, blocked, skipped, errors };
}

function pdBuildEmptyPlaceholderSyncResult_() {
  return { placeholdersCreated: 0, placeholdersReused: 0, synced: 0, blocked: 0, skipped: 0, errors: 0 };
}

function pdBuildPlaceholderSyncMessage_(blockerMessage) {
  const lines = [
    'Placeholder PDF link synced to Kit.',
    'The final PDF will update this same Drive URL once all required info is available.',
  ];
  const normalizedBlockerMessage = String(blockerMessage || '').trim();

  if (normalizedBlockerMessage) {
    lines.push('');
    lines.push(normalizedBlockerMessage);
  }

  return lines.join('\n');
}

function pdLoadRunContext_(sheet, includeTemplate) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(pdNormalizeHeader_);
  const optionalPreflightHeaders = pdGetOptionalPreflightHeadersForSheet_(sheet);
  const context = { sheet, values, headers, optionalPreflightHeaders };

  if (!includeTemplate) {
    return context;
  }

  const templateDocId = pdGetTemplateDocIdForSheet_(sheet);
  const templateDoc = DocumentApp.openById(templateDocId);
  const templateBody = pdGetDocumentBody_(templateDoc);
  const placeholders = pdExtractPlaceholders_(templateBody.getText());
  const missingHeaders = pdFindMissingTemplateHeaders_(headers, placeholders);

  context.templateDocId = templateDocId;
  context.templateDoc = templateDoc;
  context.templatePlaceholders = placeholders;
  context.templateMissingHeaders = missingHeaders;
  context.templateFileName = DriveApp.getFileById(templateDoc.getId()).getName();

  return context;
}

function pdGetTemplateDocIdForSheet_(sheet) {
  const sheetName = String(sheet?.getName() || '').trim();
  const overrideDocId = PERSONALIZED_DOC_CFG.TEMPLATE_DOC_IDS_BY_SHEET[sheetName];

  if (overrideDocId) {
    return overrideDocId;
  }

  return PERSONALIZED_DOC_CFG.DEFAULT_TEMPLATE_DOC_ID;
}

function pdGetOptionalPreflightHeadersForSheet_(sheet) {
  const sheetName = String(sheet?.getName() || '').trim();
  const headerNames = PERSONALIZED_DOC_CFG.OPTIONAL_PREFLIGHT_HEADERS_BY_SHEET[sheetName] || [];

  return new Set(headerNames.map(pdNormalizeKey_));
}

function pdIsOptionalPreflightHeader_(context, headerName) {
  const optionalHeaders = context?.optionalPreflightHeaders;
  if (!optionalHeaders || !optionalHeaders.size) {
    return false;
  }

  return optionalHeaders.has(pdNormalizeKey_(headerName));
}

function pdEvaluateRowReadiness_(context, row) {
  const blockers = new Set();
  const headers = context.headers;

  const email = pdGetHeaderValue_(headers, row, PERSONALIZED_DOC_CFG.EMAIL_HEADER);
  if (!email) {
    blockers.add('EMAIL');
  }

  const transcript = pdGetHeaderValue_(headers, row, PERSONALIZED_DOC_CFG.TRANSCRIPT_HEADER);
  if (!transcript) {
    blockers.add('TRANSCRIPT');
  }

  for (const headerName of PERSONALIZED_DOC_CFG.REQUIRED_PROFILE_HEADERS) {
    if (pdIsOptionalPreflightHeader_(context, headerName)) {
      continue;
    }

    const value = pdGetHeaderValue_(headers, row, headerName);
    if (!value) {
      blockers.add(headerName);
    }
  }

  for (const missingHeader of context.templateMissingHeaders || []) {
    if (pdIsOptionalPreflightHeader_(context, missingHeader)) {
      continue;
    }

    blockers.add(missingHeader);
  }

  for (const placeholder of context.templatePlaceholders || []) {
    if (pdIsOptionalPreflightHeader_(context, placeholder)) {
      continue;
    }

    const value = pdGetValueForPlaceholder_(headers, row, placeholder);
    if (value) {
      continue;
    }

    blockers.add(placeholder);
  }

  return {
    ready: blockers.size === 0,
    blockers: Array.from(blockers).sort(),
  };
}

function pdFindMissingTemplateHeaders_(headers, placeholders) {
  const missing = new Set();

  for (const placeholder of placeholders) {
    if (pdFindHeaderIndex_(headers, placeholder) !== -1) {
      continue;
    }

    missing.add(placeholder);
  }

  return Array.from(missing).sort();
}

function pdUpsertLearnerDoc_(context, row, folder) {
  const email = pdGetHeaderValue_(context.headers, row, PERSONALIZED_DOC_CFG.EMAIL_HEADER).toLowerCase();
  const existingDocUrl = pdGetHeaderValue_(context.headers, row, PERSONALIZED_DOC_CFG.DOC_URL_HEADER);
  const docName = pdBuildDocName_(context.templateFileName, context.headers, row, email);
  const existingDocId = pdTryExtractDocIdFromUrl_(existingDocUrl);
  const existingFolderDocId = pdFindExistingDocIdInFolder_(folder, docName);
  const existingDocIds = pdGetExistingLearnerDocIds_(existingDocId, existingFolderDocId);

  if (existingDocIds.length) {
    pdTrashDriveFiles_(existingDocIds);
  }

  const createdDoc = pdCreateLearnerDoc_(context, row, folder, docName);

  return {
    id: createdDoc.id,
    name: docName,
    mode: existingDocIds.length ? 'updated' : 'created',
    url: createdDoc.url,
  };
}

function pdCreateLearnerDoc_(context, row, folder, docName) {
  const templateFile = DriveApp.getFileById(context.templateDoc.getId());
  const copiedFile = templateFile.makeCopy(docName, folder);
  const docId = copiedFile.getId();

  pdReplacePlaceholdersInDoc_(docId, context, row);

  return {
    id: docId,
    url: copiedFile.getUrl(),
  };
}

function pdUpsertLearnerPdf_(headers, row, docResult, folder) {
  const existingPdfUrl = pdGetHeaderValue_(headers, row, PERSONALIZED_DOC_CFG.PDF_URL_HEADER);
  const existingPdfId = pdTryExtractDriveFileIdFromUrl_(existingPdfUrl);
  const pdfBlob = pdBuildLearnerPdfBlob_(docResult);
  const existingPdfFile = pdGetDriveFileIfAccessible_(existingPdfId);

  if (!existingPdfFile) {
    const createdPdfFile = folder.createFile(pdfBlob);

    return {
      id: createdPdfFile.getId(),
      url: createdPdfFile.getUrl(),
    };
  }

  pdUpdateDriveFileContent_(existingPdfId, pdfBlob);
  pdRenameDriveFileIfNeeded_(existingPdfFile, pdfBlob.getName());

  return {
    id: existingPdfFile.getId(),
    url: existingPdfFile.getUrl(),
  };
}

function pdBuildLearnerPdfBlob_(docResult) {
  const sourceDoc = DocumentApp.openById(docResult.id);
  const fileName = `${docResult.name}.pdf`;
  const firstTabId = pdGetFirstTabId_(sourceDoc);

  if (!firstTabId) {
    return pdExportDocToPdfBlob_(sourceDoc, fileName);
  }

  return pdExportDocTabToPdfBlob_(sourceDoc.getId(), firstTabId, fileName);
}

function pdReplacePlaceholdersInDoc_(docId, context, row) {
  const doc = DocumentApp.openById(docId);
  const body = pdGetDocumentBody_(doc);

  for (const placeholder of context.templatePlaceholders) {
    const value = pdGetValueForPlaceholder_(context.headers, row, placeholder);
    if (!value) {
      continue;
    }

    const pattern = `\\{\\{\\s*${pdEscapeForRegex_(placeholder)}\\s*\\}\\}`;
    body.replaceText(pattern, value);
  }

  doc.saveAndClose();
}

function pdFindExistingDocIdInFolder_(folder, docName) {
  const matches = folder.getFilesByName(docName);

  while (matches.hasNext()) {
    const file = matches.next();
    if (file.getMimeType() === MimeType.GOOGLE_DOCS) {
      return file.getId();
    }
  }

  return '';
}

function pdSyncValueToKit_(email, fieldKey, value) {
  const subscriberId = pdLookupSubscriberIdByEmail_(email);
  if (!subscriberId) {
    throw new Error(`Kit subscriber not found for ${email}`);
  }

  const payload = { fields: {} };
  payload.fields[fieldKey] = value;

  const response = UrlFetchApp.fetch(`https://api.kit.com/v4/subscribers/${encodeURIComponent(subscriberId)}`, {
    method: 'put',
    headers: {
      'X-Kit-Api-Key': pdSecret_('KIT_API_KEY'),
      'Content-Type': 'application/json',
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  if (response.getResponseCode() < 300) {
    return;
  }

  const json = pdSafeJsonParse_(response.getContentText());
  const message = json?.error?.message || `Kit update failed for ${email}`;
  throw new Error(message);
}

function pdLookupSubscriberIdByEmail_(email) {
  const response = UrlFetchApp.fetch(
    `https://api.kit.com/v4/subscribers?email_address=${encodeURIComponent(email)}`,
    {
      headers: {
        'X-Kit-Api-Key': pdSecret_('KIT_API_KEY'),
      },
      muteHttpExceptions: true,
    }
  );

  if (response.getResponseCode() < 300) {
    const json = pdSafeJsonParse_(response.getContentText());
    return json?.subscribers?.[0]?.id || null;
  }

  const json = pdSafeJsonParse_(response.getContentText());
  const message = json?.error?.message || `Kit lookup failed for ${email}`;
  throw new Error(message);
}

function pdEnsureKitCustomFieldKey_(label) {
  UrlFetchApp.fetch('https://api.kit.com/v4/custom_fields', {
    method: 'post',
    headers: {
      'X-Kit-Api-Key': pdSecret_('KIT_API_KEY'),
      'Content-Type': 'application/json',
    },
    payload: JSON.stringify({ label }),
    muteHttpExceptions: true,
  });

  const response = UrlFetchApp.fetch('https://api.kit.com/v4/custom_fields', {
    headers: {
      'X-Kit-Api-Key': pdSecret_('KIT_API_KEY'),
    },
    muteHttpExceptions: true,
  });

  if (response.getResponseCode() < 300) {
    const json = pdSafeJsonParse_(response.getContentText());
    const fields = json.custom_fields || json.customFields || [];

    for (const field of fields) {
      if (field?.label === label && field?.key) {
        return field.key;
      }
    }
  }

  const json = pdSafeJsonParse_(response.getContentText());
  const message = json?.error?.message || `Could not find Kit custom field: ${label}`;
  throw new Error(message);
}

function pdEnsureTabFolder_(sheetName) {
  const parent = DriveApp.getFolderById(PERSONALIZED_DOC_CFG.PARENT_FOLDER_ID);
  const matches = parent.getFoldersByName(sheetName);

  if (matches.hasNext()) {
    return matches.next();
  }

  return parent.createFolder(sheetName);
}

function pdEnsureOutputColumn_(sheet, headers, headerName) {
  const existingIndex = pdFindHeaderIndex_(headers, headerName);
  if (existingIndex !== -1) {
    return existingIndex;
  }

  const column = headers.length + 1;
  sheet.getRange(1, column).setValue(headerName);
  headers.push(headerName);
  return column - 1;
}

function pdWriteStatus_(sheet, rowNumber, statusCol, status, message) {
  const cell = sheet.getRange(rowNumber, statusCol + 1);
  cell.setValue(status);
  cell.setNote(message || '');
  cell.setBackground(pdGetStatusColor_(status));
}

function pdGetStatusColor_(status) {
  if (status === PERSONALIZED_DOC_CFG.STATUS.BLOCKED) {
    return PERSONALIZED_DOC_CFG.BLOCKED_HEX;
  }

  if (status === PERSONALIZED_DOC_CFG.STATUS.ERROR) {
    return PERSONALIZED_DOC_CFG.ERROR_HEX;
  }

  return PERSONALIZED_DOC_CFG.READY_HEX;
}

function pdPickReadyStatus_(currentStatus, headers, row) {
  const normalizedCurrent = String(currentStatus || '').trim().toUpperCase();

  if (normalizedCurrent === PERSONALIZED_DOC_CFG.STATUS.KIT_SYNCED) {
    return PERSONALIZED_DOC_CFG.STATUS.KIT_SYNCED;
  }

  if (pdGetHeaderValue_(headers, row, PERSONALIZED_DOC_CFG.PDF_URL_HEADER)) {
    return PERSONALIZED_DOC_CFG.STATUS.PDF_READY;
  }

  if (pdGetHeaderValue_(headers, row, PERSONALIZED_DOC_CFG.DOC_URL_HEADER)) {
    return PERSONALIZED_DOC_CFG.STATUS.DOC_READY;
  }

  return PERSONALIZED_DOC_CFG.STATUS.READY;
}

function pdBuildBlockerMessage_(blockers) {
  if (!blockers.length) {
    return 'No blockers.';
  }

  return `Missing or unresolved:\n- ${blockers.join('\n- ')}`;
}

function pdBuildDocBuildMessage_(evaluation, warnings) {
  const lines = [];

  if (evaluation.ready) {
    lines.push('Doc and PDF are ready.');
  } else {
    lines.push(`Doc and PDF are ready, but some fields were blank:\n- ${evaluation.blockers.join('\n- ')}`);
  }

  const uniqueWarnings = Array.from(new Set((warnings || []).filter(Boolean)));
  if (!uniqueWarnings.length) {
    return lines.join('\n');
  }

  lines.push('');
  lines.push('Warning:');
  lines.push(uniqueWarnings.join('\n\n'));

  return lines.join('\n');
}

function pdGetValueForPlaceholder_(headers, row, placeholder) {
  return pdGetHeaderValue_(headers, row, placeholder);
}

function pdBuildDocName_(templateName, headers, row, email) {
  const name = pdGetFirstPresentValue_(headers, row, ['NAME', 'FULL_NAME', 'FIRST_NAME']) || email;
  const baseName = String(templateName || '').trim() || 'Personal AILA Prompt Guide';
  return `${baseName} - ${name}`.trim();
}

function pdGetFirstPresentValue_(headers, row, keys) {
  for (const key of keys) {
    const value = pdGetHeaderValue_(headers, row, key);
    if (value) {
      return value;
    }
  }

  return '';
}

function pdGetHeaderValue_(headers, row, headerName) {
  const indexes = pdFindHeaderIndexes_(headers, headerName);

  for (const index of indexes) {
    const value = String(row[index] || '').trim();
    if (value) {
      return value;
    }
  }

  return '';
}

function pdExtractPlaceholders_(text) {
  const placeholders = new Set();
  const regex = /\{\{\s*([^}]+?)\s*\}\}/g;
  let match;

  while ((match = regex.exec(String(text || '')))) {
    placeholders.add(match[1].trim());
  }

  return Array.from(placeholders);
}

function pdTryExtractDocIdFromUrl_(docUrl) {
  try {
    return pdExtractDocIdFromUrl_(docUrl);
  } catch (_) {
    return '';
  }
}

function pdExtractDocIdFromUrl_(docUrl) {
  const docId = pdExtractDriveFileIdFromUrl_(docUrl);
  if (docId) {
    return docId;
  }

  throw new Error(`Invalid Google Doc URL: ${docUrl}`);
}

function pdTryExtractDriveFileIdFromUrl_(fileUrl) {
  try {
    return pdExtractDriveFileIdFromUrl_(fileUrl);
  } catch (_) {
    return '';
  }
}

function pdExtractDriveFileIdFromUrl_(fileUrl) {
  const raw = String(fileUrl || '').trim();
  if (!raw) {
    throw new Error('Missing Drive file URL.');
  }

  const patterns = [
    /\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  throw new Error(`Invalid Drive file URL: ${fileUrl}`);
}

function pdCanOpenDocument_(docId) {
  try {
    DocumentApp.openById(docId);
    return true;
  } catch (_) {
    return false;
  }
}

function pdGetDriveFileIfAccessible_(fileId) {
  if (!fileId) {
    return null;
  }

  try {
    const file = DriveApp.getFileById(fileId);
    file.getName();
    return file;
  } catch (_) {
    return null;
  }
}

function pdTrashDriveFileIfPresent_(fileId) {
  try {
    DriveApp.getFileById(fileId).setTrashed(true);
  } catch (_) {
    Logger.log(`Could not trash file: ${fileId}`);
  }
}

function pdRequireColumn_(headers, headerName) {
  const index = pdFindHeaderIndex_(headers, headerName);
  if (index !== -1) {
    return index;
  }

  throw new Error(`Missing required column: ${headerName}`);
}

function pdFindHeaderIndex_(headers, headerName) {
  const indexes = pdFindHeaderIndexes_(headers, headerName);
  return indexes.length ? indexes[0] : -1;
}

function pdFindHeaderIndexes_(headers, headerName) {
  const normalizedTarget = pdNormalizeKey_(headerName);
  const indexes = [];

  for (let index = 0; index < headers.length; index++) {
    if (pdNormalizeKey_(headers[index]) === normalizedTarget) {
      indexes.push(index);
    }
  }

  return indexes;
}

function pdGetExistingLearnerDocIds_(existingDocId, existingFolderDocId) {
  const ids = new Set();

  if (existingDocId && pdCanOpenDocument_(existingDocId)) {
    ids.add(existingDocId);
  }

  if (existingFolderDocId && pdCanOpenDocument_(existingFolderDocId)) {
    ids.add(existingFolderDocId);
  }

  return Array.from(ids);
}

function pdTrashDriveFiles_(fileIds) {
  for (const fileId of fileIds) {
    pdTrashDriveFileIfPresent_(fileId);
  }
}

function pdGetDocumentBody_(doc) {
  const documentTab = pdGetFirstDocumentTab_(doc);
  if (documentTab) {
    return documentTab.getBody();
  }

  return doc.getBody();
}

function pdGetFirstDocumentTab_(doc) {
  if (!doc || typeof doc.getTabs !== 'function') {
    return null;
  }

  const tabs = doc.getTabs();
  if (!tabs || !tabs.length) {
    return null;
  }

  const firstTab = tabs[0];
  if (!firstTab || typeof firstTab.asDocumentTab !== 'function') {
    return null;
  }

  return firstTab.asDocumentTab();
}

function pdGetFirstTabId_(doc) {
  if (!doc || typeof doc.getTabs !== 'function') {
    return '';
  }

  const tabs = doc.getTabs();
  if (!tabs || !tabs.length) {
    return '';
  }

  const firstTab = tabs[0];
  if (!firstTab || typeof firstTab.getId !== 'function') {
    return '';
  }

  return String(firstTab.getId() || '');
}

function pdExportDocToPdfBlob_(doc, fileName) {
  // Export from DocumentApp so Google uses the document tab content directly.
  return doc.getAs(MimeType.PDF).setName(fileName);
}

function pdExportDocTabToPdfBlob_(docId, tabId, fileName) {
  // Google Docs supports exporting the current tab in the UI.
  // This mirrors that behavior by exporting the first tab directly.
  const exportUrl =
    `https://docs.google.com/document/d/${encodeURIComponent(docId)}/export` +
    `?format=pdf&tab=${encodeURIComponent(tabId)}`;

  const response = UrlFetchApp.fetch(exportUrl, {
    headers: {
      Authorization: `Bearer ${ScriptApp.getOAuthToken()}`,
    },
    muteHttpExceptions: true,
  });

  const statusCode = response.getResponseCode();
  if (statusCode >= 200 && statusCode < 300) {
    return response.getBlob().setName(fileName);
  }

  throw new Error(`Tab PDF export failed with status ${statusCode}.`);
}

function pdUpdateDriveFileContent_(fileId, blob) {
  const uploadUrl =
    `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}` +
    '?uploadType=media&supportsAllDrives=true';
  const response = UrlFetchApp.fetch(uploadUrl, {
    method: 'patch',
    headers: {
      Authorization: `Bearer ${ScriptApp.getOAuthToken()}`,
    },
    contentType: blob.getContentType() || MimeType.PDF,
    payload: blob.getBytes(),
    muteHttpExceptions: true,
  });
  const statusCode = response.getResponseCode();

  if (statusCode >= 200 && statusCode < 300) {
    return;
  }

  const responseBody = response.getContentText();
  const json = pdSafeJsonParse_(responseBody);
  const driveMessage = json?.error?.message;

  if (driveMessage) {
    throw new Error(`Drive PDF update failed: ${driveMessage}`);
  }

  throw new Error(`Drive PDF update failed with status ${statusCode}.`);
}

function pdRenameDriveFileIfNeeded_(file, nextName) {
  const normalizedNextName = String(nextName || '').trim();
  if (!normalizedNextName) {
    return;
  }

  const currentName = String(file.getName() || '').trim();
  if (currentName === normalizedNextName) {
    return;
  }

  DriveApp.getFileById(file.getId()).setName(normalizedNextName);
}

function pdGetSelectedLearnerRows_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < PERSONALIZED_DOC_CFG.DATA_START_ROW) {
    throw new Error('No data rows found.');
  }

  const ranges = pdGetSelectedRanges_(sheet);
  if (!ranges.length) {
    throw new Error('No selection.');
  }

  const rows = pdGetSelectedRows_(ranges, lastRow, PERSONALIZED_DOC_CFG.DATA_START_ROW);
  if (rows.length) {
    return rows;
  }

  throw new Error('Select at least one learner row.');
}

function pdGetAllLearnerRows_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < PERSONALIZED_DOC_CFG.DATA_START_ROW) {
    throw new Error('No data rows found.');
  }

  const rows = [];

  for (let row = PERSONALIZED_DOC_CFG.DATA_START_ROW; row <= lastRow; row++) {
    rows.push(row);
  }

  return rows;
}

function pdGetSelectedRanges_(sheet) {
  const rangeList = sheet.getActiveRangeList();
  const ranges = rangeList ? rangeList.getRanges() : [];

  if (ranges.length) {
    return ranges;
  }

  const activeRange = sheet.getActiveRange();
  if (!activeRange) {
    return [];
  }

  return [activeRange];
}

function pdGetSelectedRows_(ranges, maxRow, minRow) {
  const rowSet = new Set();

  for (const range of ranges) {
    const start = Math.max(minRow, range.getRow());
    const end = Math.min(maxRow, range.getRow() + range.getNumRows() - 1);

    for (let row = start; row <= end; row++) {
      rowSet.add(row);
    }
  }

  return Array.from(rowSet).sort((left, right) => left - right);
}

function pdNormalizeHeader_(value) {
  return String(value || '').replace(/\u00A0/g, ' ').trim();
}

function pdNormalizeKey_(value) {
  return pdNormalizeHeader_(value).toUpperCase().replace(/\s+/g, '_');
}

function pdEscapeForRegex_(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function pdSafeJsonParse_(text) {
  try {
    return JSON.parse(text);
  } catch (_) {
    return null;
  }
}

function pdSecret_(key) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  if (!value) {
    throw new Error(`Missing Script Property: ${key}`);
  }

  return value;
}
