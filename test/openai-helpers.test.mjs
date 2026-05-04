import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function loadOpenAIHelpers() {
  const source = readFileSync("app_scripts/openai.js", "utf8");
  const context = {
    console,
    Utilities: {
      computeDigest(_algorithm, value) {
        return Array.from(new TextEncoder().encode(value)).slice(0, 32);
      },
      DigestAlgorithm: { SHA_256: "SHA_256" },
    },
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  return context;
}

describe("OpenAI helper behavior", () => {
  test("manifest includes trigger management OAuth scope", () => {
    const manifest = JSON.parse(readFileSync("app_scripts/appsscript.json", "utf8"));

    expect(manifest.oauthScopes).toContain("https://www.googleapis.com/auth/script.scriptapp");
  });

  test("course generation entrypoints declare lastCol before using it", () => {
    const source = readFileSync("app_scripts/openai.js", "utf8");
    const functionNames = [
      "openaiGenerateSelectedRowsSelectedCourseCols",
      "openaiGenerateSelectedRowsAllCourseCols",
      "openaiCreateBatchSelectedRowsSelectedCourseCols",
      "openaiCreateBatchSelectedRowsAllCourseCols",
    ];

    for (const functionName of functionNames) {
      const start = source.indexOf(`function ${functionName}()`);
      expect(start).toBeGreaterThanOrEqual(0);

      const nextFunction = source.indexOf("\nfunction ", start + 1);
      const body = source.slice(start, nextFunction === -1 ? undefined : nextFunction);
      const declaration = body.indexOf("const lastCol = sh.getLastColumn()");
      const firstRangeUse = body.indexOf("lastRow, lastCol");

      expect(declaration).toBeGreaterThanOrEqual(0);
      expect(declaration).toBeLessThan(firstRangeUse);
    }
  });

  test("buildOpenAICacheKey_ is stable for semantically identical payloads", () => {
    const ctx = loadOpenAIHelpers();

    const first = ctx.buildOpenAICacheKey_("task", {
      model: "gpt-5.4-mini",
      input: "Same",
      extra: { b: 2, a: 1 },
    });
    const second = ctx.buildOpenAICacheKey_("task", {
      extra: { a: 1, b: 2 },
      input: "Same",
      model: "gpt-5.4-mini",
    });

    expect(first).toBe(second);
    expect(first.startsWith("task:")).toBe(true);
  });

  test("buildOpenAIBatchFileContent_ emits one JSONL request per item", () => {
    const ctx = loadOpenAIHelpers();
    const lines = ctx.buildOpenAIBatchFileContent_([
      {
        customId: "course:r3:c7",
        body: { model: "gpt-5.4-mini", input: "one" },
      },
      {
        customId: "course:r4:c7",
        body: { model: "gpt-5.4-mini", input: "two" },
      },
    ]).split("\n");

    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0])).toEqual({
      custom_id: "course:r3:c7",
      method: "POST",
      url: "/v1/responses",
      body: { model: "gpt-5.4-mini", input: "one" },
    });
  });

  test("parseOpenAIBatchCustomId_ supports course and intake blueprint jobs", () => {
    const ctx = loadOpenAIHelpers();

    expect(ctx.parseOpenAIBatchCustomId_("course:r3:c7:kabc123")).toEqual({
      task: "course",
      rowNumber: 3,
      colNumber: 7,
      cacheKeyTail: "abc123",
    });
    expect(ctx.parseOpenAIBatchCustomId_("intake_blueprint:r12:c5:kdef456")).toEqual({
      task: "intake_blueprint",
      rowNumber: 12,
      colNumber: 5,
      cacheKeyTail: "def456",
    });
    expect(ctx.parseOpenAIBatchCustomId_("intake_fields:r12:c6:kghi789")).toEqual({
      task: "intake_fields",
      rowNumber: 12,
      colNumber: 6,
      cacheKeyTail: "ghi789",
    });
    expect(ctx.parseOpenAIBatchCustomId_("bad")).toBeNull();
  });

  test("extractOpenAIUsageRow_ flattens Responses API usage fields", () => {
    const ctx = loadOpenAIHelpers();
    const row = ctx.extractOpenAIUsageRow_("task", "model", "cache-key", "ok", {
      id: "resp_123",
      usage: {
        input_tokens: 100,
        output_tokens: 20,
        total_tokens: 120,
        input_tokens_details: { cached_tokens: 64 },
        output_tokens_details: { reasoning_tokens: 5 },
      },
    });

    expect(row.slice(1)).toEqual([
      "task",
      "model",
      "cache-key",
      "ok",
      "resp_123",
      100,
      20,
      120,
      64,
      5,
    ]);
  });

  test("normalizeBatchBlueprintOutput_ unwraps structured blueprint JSON", () => {
    const ctx = loadOpenAIHelpers();

    expect(ctx.normalizeBatchBlueprintOutput_('{"blueprint":"Name: Ada"}')).toBe("Name: Ada");
    expect(ctx.normalizeBatchBlueprintOutput_("Name: Ada")).toBe("Name: Ada");
  });

  test("parseBatchIntakeFieldsOutput_ unwraps structured field JSON", () => {
    const ctx = loadOpenAIHelpers();

    expect(ctx.parseBatchIntakeFieldsOutput_('{"role":"CEO","company":"Acme","industry":"software","course_goal":"Reduce reporting time"}')).toEqual({
      role: "CEO",
      company: "Acme",
      industry: "Technology",
      course_goal: "Reduce reporting time",
    });
  });

  test("loadOpenAICacheMap_ does not touch sheets when sheet cache reads are disabled", () => {
    const ctx = loadOpenAIHelpers();

    expect(ctx.loadOpenAICacheMap_()).toEqual({});
  });
});
