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

describe('personalized docs full delivery', () => {
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

describe('intake generation', () => {
  test('combined intake generation creates blueprints and backfills Notion enrichment without OpenAI field extraction', () => {
    const calls = [];
    const context = loadOpenAi({ __calls: calls });
    vm.runInContext(`
      runIntakeBlueprint_ = (sheet, data, rows) => {
        __calls.push(['blueprint', rows.slice()]);
        return { writes: 1, skipped: 0, errors: 0 };
      };
      runIntakeFields_ = () => {
        throw new Error('OpenAI field extraction should not run');
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
    ]);
    expect(result).toEqual({ writes: 2, skipped: 1, errors: 0 });
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
                    Title: { type: 'rich_text', rich_text: [{ plain_text: 'CTO' }] },
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
        role: 'CTO',
        company: 'Analytical Engines',
        industry: 'Technology',
      },
    });
  });
});
