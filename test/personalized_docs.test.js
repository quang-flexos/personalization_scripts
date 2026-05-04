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

  test('creates and syncs a placeholder PDF URL for a blocked row', () => {
    const createdFiles = [];
    const syncedValues = [];
    const values = [
      ['EMAIL', 'NAME', 'PDF_URL', 'DELIVERY_STATUS'],
      ['', '', '', ''],
      ['blocked@example.com', 'Ada Lovelace', '', 'BLOCKED'],
    ];
    const context = loadPersonalizedDocs({
      MimeType: { PDF: 'application/pdf' },
      Utilities: {
        newBlob(content, contentType, name) {
          return {
            content,
            contentType,
            name,
            setName(nextName) {
              this.name = nextName;
              return this;
            },
          };
        },
      },
      __folder: {
        createFile(blob) {
          createdFiles.push(blob);
          return {
            getUrl: () => 'https://drive.google.com/file/d/placeholder-id/view',
          };
        },
      },
      __syncedValues: syncedValues,
    });
    vm.runInContext(`
      pdEnsureKitCustomFieldKey_ = () => 'pdf_url';
      pdEnsureTabFolder_ = () => __folder;
      pdGetDriveFileIfAccessible_ = () => null;
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
    expect(createdFiles[0].name).toBe('Personalized AILA Prompt Guide - Ada Lovelace - pending.pdf');
    expect(createdFiles[0].contentType).toBe('application/pdf');
    expect(createdFiles[0].content.startsWith('%PDF-1.4')).toBe(true);
    expect(values[2][2]).toBe('https://drive.google.com/file/d/placeholder-id/view');
    expect(syncedValues).toEqual([
      {
        email: 'blocked@example.com',
        fieldKey: 'pdf_url',
        value: 'https://drive.google.com/file/d/placeholder-id/view',
      },
    ]);
    expect(writes).toContainEqual({
      row: 3,
      col: 4,
      type: 'value',
      value: 'PLACEHOLDER_SYNCED',
    });
  });
});
