const { describe, expect, test } = require('bun:test');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadPersonalizedDocs(extraContext = {}) {
  const context = {
    console,
    Logger: { log() {} },
    ...extraContext,
  };
  vm.createContext(context);
  const source = fs.readFileSync(path.join(__dirname, '..', 'app_scripts', 'personalized_docs.js'), 'utf8');
  vm.runInContext(source, context);
  return context;
}

function loadOpenAi(extraContext = {}) {
  const context = {
    console,
    Logger: { log() {} },
    Utilities: { sleep() {} },
    ...extraContext,
  };
  vm.createContext(context);
  const source = fs.readFileSync(path.join(__dirname, '..', 'app_scripts', 'openai.js'), 'utf8');
  vm.runInContext(source, context);
  return context;
}

function loadS3(extraContext = {}) {
  const context = {
    console,
    Logger: { log() {} },
    ...extraContext,
  };
  vm.createContext(context);
  const source = fs.readFileSync(path.join(__dirname, '..', 'app_scripts', 's3.js'), 'utf8');
  vm.runInContext(source, context);
  return context;
}

function loadKit(extraContext = {}) {
  const context = {
    console,
    Logger: { log() {} },
    ...extraContext,
  };
  vm.createContext(context);
  const source = fs.readFileSync(path.join(__dirname, '..', 'app_scripts', 'kit.js'), 'utf8');
  vm.runInContext(source, context);
  return context;
}

function loadKitOpenAiAndNotionSync(extraContext = {}) {
  const context = {
    console,
    Logger: { log() {} },
    Utilities: { sleep() {} },
    ...extraContext,
  };
  vm.createContext(context);
  for (const fileName of ['kit.js', 'openai.js', 'notion_sync.js']) {
    const source = fs.readFileSync(path.join(__dirname, '..', 'app_scripts', fileName), 'utf8');
    vm.runInContext(source, context);
  }
  return context;
}

function createS3Context({ notionRows = {}, existingSheets = ['Inbox', 'AILA 5'] } = {}) {
  const sheets = {};
  const calls = [];

  function createSheet(name, header = ['DATE', 'NAME', 'EMAIL', 'ID', 'TRANSCRIPT']) {
    const values = [header.slice()];
    const sheet = {
      name,
      values,
      getName: () => name,
      getLastColumn: () => values[0].length,
      getLastRow: () => values.length,
      getMaxColumns: () => values[0].length,
      getRange(row, col, numRows = 1, numCols = 1) {
        return {
          getValues() {
            return values
              .slice(row - 1, row - 1 + numRows)
              .map(sourceRow => sourceRow.slice(col - 1, col - 1 + numCols));
          },
          setValues(nextValues) {
            for (let r = 0; r < nextValues.length; r++) {
              const targetRow = row - 1 + r;
              values[targetRow] = values[targetRow] || [];
              for (let c = 0; c < nextValues[r].length; c++) {
                values[targetRow][col - 1 + c] = nextValues[r][c];
              }
            }
            return this;
          },
        };
      },
      appendRow(row) {
        values.push(row.slice());
      },
    };
    sheets[name] = sheet;
    return sheet;
  }

  for (const name of existingSheets) {
    createSheet(name);
  }

  const context = loadS3({
    __calls: calls,
    __notionRows: notionRows,
    LockService: {
      getScriptLock() {
        return { waitLock() {}, releaseLock() {} };
      },
    },
    PropertiesService: {
      getScriptProperties() {
        return {
          getProperty(key) {
            return {
              APPS_SCRIPT_SECRET: 'secret',
              NOTION_API_KEY: 'secret_notion',
              NOTION_DATABASE_ID: 'database-id',
            }[key] || '';
          },
        };
      },
    },
    SpreadsheetApp: {
      openById() {
        return {
          getSpreadsheetTimeZone: () => 'Asia/Ho_Chi_Minh',
          getSheetByName(name) {
            return sheets[name] || null;
          },
          insertSheet(name) {
            calls.push(['insertSheet', name]);
            return createSheet(name, []);
          },
        };
      },
    },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput(text) {
        return {
          text,
          mimeType: '',
          setMimeType(mimeType) {
            this.mimeType = mimeType;
            return this;
          },
        };
      },
    },
    Utilities: {
      formatDate() {
        return '2026-05-08 10:00:00';
      },
    },
    UrlFetchApp: {
      fetch(url) {
        calls.push(['fetch', url]);
        if (url.includes('/v1/databases/')) {
          return {
            getResponseCode: () => 200,
            getContentText: () => JSON.stringify({ data_sources: [{ id: 'data-source-id' }] }),
          };
        }

        return {
          getResponseCode: () => 200,
          getContentText: () => JSON.stringify({
            results: Object.entries(notionRows).map(([email, cohortCodes]) => ({
              properties: {
                Email: { type: 'email', email },
                'Cohort Codes': {
                  type: 'multi_select',
                  multi_select: cohortCodes.map(name => ({ name })),
                },
              },
            })),
            has_more: false,
          }),
        };
      },
    },
  });

  return { context, sheets, calls };
}

describe('personalized docs full delivery', () => {
  test('retries transient spreadsheet timeouts while writing row status', () => {
    const calls = [];
    const context = loadPersonalizedDocs({
      __calls: calls,
      Utilities: {
        sleep(ms) {
          calls.push(['sleep', ms]);
        },
      },
    });
    const cell = {
      setValue(value) {
        calls.push(['setValue', value]);
        if (calls.filter(call => call[0] === 'setValue').length === 1) {
          throw new Error('Service Spreadsheets timed out while accessing document with ID sheet-id.');
        }
        return cell;
      },
      setNote(value) {
        calls.push(['setNote', value]);
        return cell;
      },
      setBackground(value) {
        calls.push(['setBackground', value]);
        return cell;
      },
    };
    const sheet = {
      getRange(row, col) {
        calls.push(['getRange', row, col]);
        return cell;
      },
    };

    context.pdWriteStatus_(sheet, 3, 4, 'KIT_SYNCED', 'PDF link synced to Kit.');

    expect(calls).toEqual([
      ['getRange', 3, 5],
      ['setValue', 'KIT_SYNCED'],
      ['sleep', 500],
      ['getRange', 3, 5],
      ['setValue', 'KIT_SYNCED'],
      ['setNote', 'PDF link synced to Kit.'],
      ['setBackground', '#d9ead3'],
    ]);
  });

  test('syncs placeholder PDF URLs for blocked rows while building ready rows', () => {
    const context = loadPersonalizedDocs({ __calls: [] });
    vm.runInContext(`
      pdRunPreflight_ = (sheet, rows) => {
        __calls.push(['preflight', sheet, rows]);
        return { ready: 1, blocked: 1, skipped: 0, errors: 0, readyRows: [3], blockedRows: [4] };
      };
      pdRunDocAndPdfBuild_ = (sheet, rows) => {
        __calls.push(['build', sheet, rows]);
        return { createdDocs: 1, updatedDocs: 0, pdfsBuilt: 1, blocked: 0, skipped: 0, errors: 0, successfulRows: [3] };
      };
      pdRunPdfSync_ = (sheet, rows) => {
        __calls.push(['sync', sheet, rows]);
        return { synced: 1, blocked: 0, skipped: 0, errors: 0 };
      };
      pdRunPlaceholderPdfSync_ = (sheet, rows) => {
        __calls.push(['placeholder', sheet, rows]);
        return { placeholdersCreated: 1, placeholdersReused: 0, synced: 1, blocked: 0, skipped: 0, errors: 0 };
      };
    `, context);

    const result = context.pdRunFullDelivery_('sheet', [3, 4]);

    expect(context.__calls).toEqual([
      ['preflight', 'sheet', [3, 4]],
      ['build', 'sheet', [3]],
      ['sync', 'sheet', [3]],
      ['placeholder', 'sheet', [4]],
    ]);
    expect(result.placeholderSync).toEqual({
      placeholdersCreated: 1,
      placeholdersReused: 0,
      synced: 1,
      blocked: 0,
      skipped: 0,
      errors: 0,
    });
  });

  test('builds and syncs placeholder URLs through the normal doc and PDF pipeline', () => {
    const pipelineCalls = [];
    const syncedValues = [];
    const values = [
      ['EMAIL', 'NAME', 'DOC_URL', 'PDF_URL', 'DELIVERY_STATUS'],
      ['', '', '', '', ''],
      ['blocked@example.com', 'Ada Lovelace', '', '', 'BLOCKED'],
    ];
    const context = loadPersonalizedDocs({
      __folder: {
        getName: () => 'Inbox',
      },
      __pipelineCalls: pipelineCalls,
      __syncedValues: syncedValues,
    });
    vm.runInContext(`
      pdLoadRunContext_ = (sheet, includeTemplate) => {
        __pipelineCalls.push(['context', includeTemplate]);
        return {
          values: sheet.getDataRange().getValues(),
          headers: sheet.getDataRange().getValues()[0],
          templateFileName: 'Personalized AILA Prompt Guide',
          templatePlaceholders: ['NAME', 'ROLE'],
        };
      };
      pdEnsureKitCustomFieldKey_ = () => 'pdf_url';
      pdEnsureTabFolder_ = () => __folder;
      pdUpsertLearnerDoc_ = (context, row, folder) => {
        __pipelineCalls.push(['doc', row[0], folder.getName()]);
        return {
          id: 'doc-id',
          name: 'Personalized AILA Prompt Guide - Ada Lovelace',
          mode: 'created',
          url: 'https://docs.google.com/document/d/doc-id/edit',
        };
      };
      pdUpsertLearnerPdf_ = (headers, row, docResult, folder) => {
        __pipelineCalls.push(['pdf', docResult.id, folder.getName()]);
        return {
          id: 'pdf-id',
          url: 'https://drive.google.com/file/d/pdf-id/view',
        };
      };
      pdSyncValueToKit_ = (email, fieldKey, value) => __syncedValues.push({ email, fieldKey, value });
    `, context);

    const writes = [];
    const sheet = {
      getName: () => 'Inbox',
      getDataRange: () => ({ getValues: () => values }),
      getRange(row, col) {
        const cell = {
          setValue(value) {
            writes.push({ row, col, type: 'value', value });
            values[row - 1][col - 1] = value;
            return cell;
          },
          setBackground(value) {
            writes.push({ row, col, type: 'background', value });
            return cell;
          },
          setNote(value) {
            writes.push({ row, col, type: 'note', value });
            return cell;
          },
        };
        return cell;
      },
    };

    const result = context.pdRunPlaceholderPdfSync_(sheet, [3]);

    expect(result).toEqual({
      placeholdersCreated: 1,
      placeholdersReused: 0,
      synced: 1,
      blocked: 0,
      skipped: 0,
      errors: 0,
    });
    expect(pipelineCalls).toEqual([
      ['context', true],
      ['doc', 'blocked@example.com', 'Inbox'],
      ['pdf', 'doc-id', 'Inbox'],
    ]);
    expect(values[2][2]).toBe('https://docs.google.com/document/d/doc-id/edit');
    expect(values[2][3]).toBe('https://drive.google.com/file/d/pdf-id/view');
    expect(syncedValues).toEqual([
      {
        email: 'blocked@example.com',
        fieldKey: 'pdf_url',
        value: 'https://drive.google.com/file/d/pdf-id/view',
      },
    ]);
    expect(writes).toContainEqual({
      row: 3,
      col: 5,
      type: 'value',
      value: 'PLACEHOLDER_SYNCED',
    });
  });
});

describe('transcript intake webhook routing', () => {
  test('routes private cohort codes to uppercase cohort tabs and creates missing tabs', () => {
    const { context, sheets, calls } = createS3Context({ existingSheets: ['Inbox', 'AILA 5'] });

    const response = context.doPost({
      postData: {
        contents: JSON.stringify({
          secret: 'secret',
          completed: true,
          cohort: 'wolt',
          uploaded_at: '2026-05-08T03:00:00Z',
          name: 'Ada',
          email: 'ada@example.com',
          transcript: 'hello',
        }),
      },
    });

    expect(JSON.parse(response.text)).toEqual({ ok: true, tab: 'WOLT', row: 2 });
    expect(calls).toContainEqual(['insertSheet', 'WOLT']);
    expect(sheets.WOLT.values[0]).toEqual(sheets['AILA 5'].values[0]);
    expect(sheets.WOLT.values[1][2]).toBe('ada@example.com');
    expect(sheets.WOLT.values[1][4]).toBe('hello');
  });

  test('routes null cohort through Notion Cohort Codes to the latest public AILA tab', () => {
    const { context, sheets } = createS3Context({
      notionRows: {
        'ada@example.com': ['AILA #2', 'AILA #5'],
      },
    });

    const response = context.doPost({
      postData: {
        contents: JSON.stringify({
          secret: 'secret',
          completed: true,
          cohort: null,
          name: 'Ada',
          email: 'ada@example.com',
          transcript: 'hello',
        }),
      },
    });

    expect(JSON.parse(response.text)).toEqual({ ok: true, tab: 'AILA 5', row: 2 });
    expect(sheets['AILA 5'].values[1][2]).toBe('ada@example.com');
    expect(sheets.Inbox.values).toHaveLength(1);
  });

  test('falls back to Inbox when Notion has no cohort match', () => {
    const { context, sheets } = createS3Context({
      notionRows: {
        'other@example.com': ['AILA #5'],
      },
    });

    const response = context.doPost({
      postData: {
        contents: JSON.stringify({
          secret: 'secret',
          completed: true,
          cohort: '',
          name: 'Ada',
          email: 'ada@example.com',
          transcript: 'hello',
        }),
      },
    });

    expect(JSON.parse(response.text)).toEqual({ ok: true, tab: 'Inbox', row: 2 });
    expect(sheets.Inbox.values[1][2]).toBe('ada@example.com');
    expect(sheets['AILA 5'].values).toHaveLength(1);
  });
});

describe('intake generation', () => {
  test('combined intake generation creates blueprints, backfills Notion enrichment, then falls back to transcript fields', () => {
    const calls = [];
    const context = loadOpenAi({ __calls: calls });
    vm.runInContext(`
      runIntakeBlueprint_ = (sheet, data, rows) => {
        __calls.push(['blueprint', rows.slice()]);
        return { writes: 1, skipped: 0, errors: 0 };
      };
      runIntakeFields_ = (sheet, data, rows) => {
        __calls.push(['transcript-fields', rows.slice()]);
        return { writes: 1, skipped: 1, errors: 0 };
      };
      runNotionEnrichmentBackfill_ = (sheet, data, rows) => {
        __calls.push(['notion', rows.slice()]);
        return { writes: 1, skipped: 1, errors: 0 };
      };
    `, context);

    const result = context.runIntakeCombined_('sheet', [['EMAIL']], [3, 4]);

    expect(calls).toEqual([
      ['blueprint', [3, 4]],
      ['notion', [3, 4]],
      ['transcript-fields', [3, 4]],
    ]);
    expect(result).toEqual({ writes: 3, skipped: 2, errors: 0 });
  });

  test('transcript fallback fills missing intake fields without overwriting Notion enrichment', () => {
    const writes = [];
    const fieldCalls = [];
    const data = [
      ['EMAIL', 'TRANSCRIPT', 'BLUEPRINT', 'ROLE', 'COMPANY', 'INDUSTRY'],
      ['', '', '', '', '', ''],
      ['ada@example.com', 'I am founder of Delta Labs in fintech.', '', '', '', ''],
      ['grace@example.com', 'I am CEO at Navy Systems.', '', '', '', ''],
    ];
    const context = loadKitOpenAiAndNotionSync({
      __fieldCalls: fieldCalls,
      __lookup: {
        'grace@example.com': {
          role: 'CEO',
          company: 'Navy Systems',
          industry: 'technology',
        },
      },
    });
    vm.runInContext(`
      runIntakeBlueprint_ = () => ({ writes: 0, skipped: 2, errors: 0 });
      loadNotionEnrichmentLookup_ = () => __lookup;
      callOpenAIIntakeFields_ = (transcript) => {
        __fieldCalls.push(transcript);
        return {
          role: 'Founder',
          company: 'Delta Labs',
          industry: 'Fintech',
        };
      };
    `, context);

    const sheet = {
      getRange(row, col) {
        return {
          setValue(value) {
            writes.push({ row, col, value });
          },
        };
      },
    };

    const result = context.runIntakeCombined_(sheet, data, [3, 4]);

    expect(result).toEqual({ writes: 2, skipped: 4, errors: 0 });
    expect(fieldCalls).toEqual(['I am founder of Delta Labs in fintech.']);
    expect(writes).toEqual([
      { row: 4, col: 4, value: 'CEO' },
      { row: 4, col: 5, value: 'Navy Systems' },
      { row: 4, col: 6, value: 'Technology' },
      { row: 3, col: 4, value: 'Founder' },
      { row: 3, col: 5, value: 'Delta Labs' },
      { row: 3, col: 6, value: 'Financial Services' },
    ]);
    expect(data[2]).toEqual([
      'ada@example.com',
      'I am founder of Delta Labs in fintech.',
      '',
      'Founder',
      'Delta Labs',
      'Financial Services',
    ]);
    expect(data[3]).toEqual([
      'grace@example.com',
      'I am CEO at Navy Systems.',
      '',
      'CEO',
      'Navy Systems',
      'Technology',
    ]);
  });

  test('intake menu exposes only selected row and all missing row blueprint actions', () => {
    const menuItems = [];
    const context = loadKit({
      SpreadsheetApp: {
        getUi() {
          return {
            createMenu(name) {
              return {
                addItem(label, fn) {
                  if (name === 'Intake') menuItems.push({ label, fn });
                  return this;
                },
                addSeparator() {
                  if (name === 'Intake') menuItems.push({ separator: true });
                  return this;
                },
                addToUi() {
                  return this;
                },
              };
            },
          };
        },
      },
    });

    context.onOpen();

    expect(menuItems).toEqual([
      {
        label: 'Generate Blueprint for selected row',
        fn: 'generateIntakeSelectedRows',
      },
      {
        label: 'Generate Blueprint for all missing rows',
        fn: 'generateIntakeAllMissing',
      },
    ]);
  });

  test('loads Notion enrichment lookup from database data source pages', () => {
    const fetches = [];
    const context = loadOpenAi({
      secret_(key) {
        if (key !== 'NOTION_API_KEY') throw new Error(`unexpected secret ${key}`);
        return 'secret_notion';
      },
      PropertiesService: {
        getScriptProperties() {
          return {
            getProperty(key) {
              return {
                NOTION_DATABASE_ID: 'd3157a005df24c889a6be339e4b2cefe',
              }[key] || '';
            },
          };
        },
      },
      UrlFetchApp: {
        fetch(url, options) {
          fetches.push({ url, options });
          if (url.includes('/v1/databases/')) {
            return {
              getResponseCode: () => 200,
              getContentText: () => JSON.stringify({
                data_sources: [{ id: 'data-source-id' }],
              }),
            };
          }

          return {
            getResponseCode: () => 200,
            getContentText: () => JSON.stringify({
              results: [
                {
                  properties: {
                    Email: { type: 'email', email: 'ADA@EXAMPLE.COM' },
                    'Current Role': { type: 'rich_text', rich_text: [{ plain_text: 'CTO' }] },
                    Company: { type: 'title', title: [{ plain_text: 'Analytical Engines' }] },
                    Industry: { type: 'select', select: { name: 'technology' } },
                  },
                },
              ],
              has_more: false,
            }),
          };
        },
      },
    });

    const lookup = context.loadNotionEnrichmentLookup_();

    expect(fetches.map(call => call.url)).toEqual([
      'https://api.notion.com/v1/databases/d3157a005df24c889a6be339e4b2cefe',
      'https://api.notion.com/v1/data_sources/data-source-id/query',
    ]);
    expect(lookup).toEqual({
      'ada@example.com': {
        name: '',
        role: 'CTO',
        company: 'Analytical Engines',
        industry: 'Technology',
      },
    });
  });

  test('loads full name from explicit Notion name property', () => {
    const context = loadOpenAi({
      secret_(key) {
        if (key !== 'NOTION_API_KEY') throw new Error(`unexpected secret ${key}`);
        return 'secret_notion';
      },
      PropertiesService: {
        getScriptProperties() {
          return {
            getProperty(key) {
              return { NOTION_DATA_SOURCE_ID: 'data-source-id' }[key] || '';
            },
          };
        },
      },
      UrlFetchApp: {
        fetch(url) {
          expect(url).toBe('https://api.notion.com/v1/data_sources/data-source-id/query');
          return {
            getResponseCode: () => 200,
            getContentText: () => JSON.stringify({
              results: [
                {
                  properties: {
                    Email: { type: 'email', email: 'ada@example.com' },
                    'Full Name': { type: 'rich_text', rich_text: [{ plain_text: 'Ada Lovelace' }] },
                    'Current Role': { type: 'rich_text', rich_text: [{ plain_text: 'CTO' }] },
                    Company: { type: 'rich_text', rich_text: [{ plain_text: 'Analytical Engines' }] },
                    Industry: { type: 'select', select: { name: 'technology' } },
                  },
                },
              ],
              has_more: false,
            }),
          };
        },
      },
    });

    expect(context.loadNotionEnrichmentLookup_()['ada@example.com']).toEqual({
      name: 'Ada Lovelace',
      role: 'CTO',
      company: 'Analytical Engines',
      industry: 'Technology',
    });
  });

  test('Notion Sync menu exposes separate field sync actions', () => {
    const menuItems = [];
    const context = loadKit({
      SpreadsheetApp: {
        getUi() {
          return {
            createMenu(name) {
              return {
                addItem(label, fn) {
                  if (name === 'Notion Sync') menuItems.push({ label, fn });
                  return this;
                },
                addSeparator() {
                  if (name === 'Notion Sync') menuItems.push({ separator: true });
                  return this;
                },
                addToUi() {
                  return this;
                },
              };
            },
          };
        },
      },
    });

    context.onOpen();

    expect(menuItems).toEqual([
      { label: 'Sync Full Name for selected rows', fn: 'syncNotionNameSelectedRows' },
      { label: 'Sync Full Name for all rows', fn: 'syncNotionNameAllRows' },
      { separator: true },
      { label: 'Sync ROLE for selected rows', fn: 'syncNotionRoleSelectedRows' },
      { label: 'Sync ROLE for all rows', fn: 'syncNotionRoleAllRows' },
      { separator: true },
      { label: 'Sync COMPANY for selected rows', fn: 'syncNotionCompanySelectedRows' },
      { label: 'Sync COMPANY for all rows', fn: 'syncNotionCompanyAllRows' },
      { separator: true },
      { label: 'Sync INDUSTRY for selected rows', fn: 'syncNotionIndustrySelectedRows' },
      { label: 'Sync INDUSTRY for all rows', fn: 'syncNotionIndustryAllRows' },
    ]);
  });

  test('full name sync replaces existing sheet names from Notion', () => {
    const writes = [];
    const data = [
      ['NAME', 'EMAIL', 'ROLE', 'COMPANY', 'INDUSTRY'],
      ['', '', '', '', ''],
      ['Ada', 'ada@example.com', '', 'Existing Co', ''],
      ['Existing Name', 'grace@example.com', '', '', ''],
      ['', 'missing@example.com', '', '', ''],
    ];
    const context = loadKitOpenAiAndNotionSync();
    vm.runInContext(`
      loadNotionEnrichmentLookup_ = () => ({
        'ada@example.com': {
          name: 'Ada Lovelace',
          role: 'CTO',
          company: 'Analytical Engines',
          industry: 'technology',
        },
        'grace@example.com': {
          name: 'Grace Hopper',
          role: 'Rear Admiral',
          company: 'US Navy',
          industry: 'computing',
        },
      });
    `, context);

    const sheet = {
      getRange(row, col) {
        return {
          setValue(value) {
            writes.push({ row, col, value });
          },
        };
      },
    };

    const result = context.runNotionProfileFieldSync_(sheet, data, [3, 4, 5], 'name');

    expect(result).toEqual({ writes: 2, skipped: 1, errors: 0 });
    expect(writes).toEqual([
      { row: 3, col: 1, value: 'Ada Lovelace' },
      { row: 4, col: 1, value: 'Grace Hopper' },
    ]);
    expect(data[2]).toEqual(['Ada Lovelace', 'ada@example.com', '', 'Existing Co', '']);
    expect(data[3]).toEqual(['Grace Hopper', 'grace@example.com', '', '', '']);
  });

  test('role company and industry sync fill blank cells without overwriting existing values', () => {
    const writes = [];
    const data = [
      ['NAME', 'EMAIL', 'ROLE', 'COMPANY', 'INDUSTRY'],
      ['', '', '', '', ''],
      ['Ada', 'ada@example.com', '', 'Existing Co', ''],
      ['Grace', 'grace@example.com', 'Existing Role', '', 'Existing Industry'],
    ];
    const context = loadKitOpenAiAndNotionSync();
    vm.runInContext(`
      loadNotionEnrichmentLookup_ = () => ({
        'ada@example.com': {
          name: 'Ada Lovelace',
          role: 'CTO',
          company: 'Analytical Engines',
          industry: 'technology',
        },
        'grace@example.com': {
          name: 'Grace Hopper',
          role: 'Rear Admiral',
          company: 'US Navy',
          industry: 'computing',
        },
      });
    `, context);

    const sheet = {
      getRange(row, col) {
        return {
          setValue(value) {
            writes.push({ row, col, value });
          },
        };
      },
    };

    expect(context.runNotionProfileFieldSync_(sheet, data, [3, 4], 'role')).toEqual({
      writes: 1,
      skipped: 1,
      errors: 0,
    });
    expect(context.runNotionProfileFieldSync_(sheet, data, [3, 4], 'company')).toEqual({
      writes: 1,
      skipped: 1,
      errors: 0,
    });
    expect(context.runNotionProfileFieldSync_(sheet, data, [3, 4], 'industry')).toEqual({
      writes: 1,
      skipped: 1,
      errors: 0,
    });

    expect(writes).toEqual([
      { row: 3, col: 3, value: 'CTO' },
      { row: 4, col: 4, value: 'US Navy' },
      { row: 3, col: 5, value: 'Technology' },
    ]);
    expect(data[2]).toEqual(['Ada', 'ada@example.com', 'CTO', 'Existing Co', 'Technology']);
    expect(data[3]).toEqual(['Grace', 'grace@example.com', 'Existing Role', 'US Navy', 'Existing Industry']);
  });
});
