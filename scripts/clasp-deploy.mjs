import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const CLASP_CONFIG_NAME = ".clasp.json";
const DEPLOY_CONFIG_NAME = ".clasp-deploy.json";
const NEW_DEPLOY_FLAG = "--new";

const exitCode = main();
if (exitCode) {
  process.exit(exitCode);
}

function main() {
  const args = process.argv.slice(2);
  const createNewDeployment = args.includes(NEW_DEPLOY_FLAG);
  const descriptionArgs = args.filter(arg => arg !== NEW_DEPLOY_FLAG);

  const claspBinary = getClaspBinaryPath();
  if (!claspBinary) {
    fail([
      "Missing local clasp install.",
      "Run `bun install` before running deploy commands.",
    ]);
    return 1;
  }

  const claspConfig = loadRequiredJsonConfig(CLASP_CONFIG_NAME);
  if (!claspConfig) {
    return 1;
  }

  const scriptId = readConfiguredValue(claspConfig.scriptId);
  if (!scriptId) {
    fail([
      `Missing scriptId in ${CLASP_CONFIG_NAME}.`,
      `Copy .clasp.json.example to ${CLASP_CONFIG_NAME} and add your existing Apps Script script ID.`,
    ]);
    return 1;
  }

  const deployConfig = createNewDeployment
    ? loadOptionalJsonConfig(DEPLOY_CONFIG_NAME)
    : loadRequiredJsonConfig(DEPLOY_CONFIG_NAME);

  if (deployConfig === null) {
    return 1;
  }

  if (!deployConfig && !createNewDeployment) {
    return 1;
  }

  const deploymentId = readConfiguredValue(deployConfig?.deploymentId);
  if (!createNewDeployment && !deploymentId) {
    fail([
      `Missing deploymentId in ${DEPLOY_CONFIG_NAME}.`,
      "Use `bun run clasp:deploy:new` for the first deployment.",
      `Then save the returned deployment ID in ${DEPLOY_CONFIG_NAME} for stable redeploys.`,
    ]);
    return 1;
  }

  const description = buildDescription(descriptionArgs, deployConfig?.description);

  runClaspCommand(claspBinary, ["push"]);

  const deployArgs = ["create-deployment", "--description", description];
  if (deploymentId) {
    deployArgs.push("--deploymentId", deploymentId);
  }

  const deployOutput = runClaspCommand(claspBinary, deployArgs);

  printSummary({
    createNewDeployment,
    configuredDeploymentId: deploymentId,
    deployOutput,
    description,
  });

  return 0;
}

function getClaspBinaryPath() {
  const binaryName = process.platform === "win32" ? "clasp.cmd" : "clasp";
  const binaryPath = resolve(process.cwd(), "node_modules", ".bin", binaryName);

  if (!existsSync(binaryPath)) {
    return "";
  }

  return binaryPath;
}

function loadRequiredJsonConfig(fileName) {
  const filePath = resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) {
    fail([
      `Missing ${fileName}.`,
      `Copy ${fileName}.example to ${fileName} and fill in the real values.`,
    ]);
    return null;
  }

  return parseJsonFile(filePath, fileName);
}

function loadOptionalJsonConfig(fileName) {
  const filePath = resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) {
    return undefined;
  }

  return parseJsonFile(filePath, fileName);
}

function parseJsonFile(filePath, fileName) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    fail([
      `Invalid JSON in ${fileName}.`,
      String(error?.message || error || "Unknown JSON parse error."),
    ]);
    return null;
  }
}

function readConfiguredValue(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }

  if (/YOUR_|REPLACE_ME|<.+>/i.test(text)) {
    return "";
  }

  return text;
}

function buildDescription(descriptionArgs, savedDescription) {
  const commandLineDescription = descriptionArgs.join(" ").trim();
  if (commandLineDescription) {
    return commandLineDescription;
  }

  const configuredDescription = readConfiguredValue(savedDescription);
  if (configuredDescription) {
    return configuredDescription;
  }

  return `Clasp deploy ${new Date().toISOString()}`;
}

function runClaspCommand(claspBinary, args) {
  const printableCommand = [claspBinary, ...args].join(" ");
  console.log(`\n> ${printableCommand}\n`);

  const result = spawnSync(claspBinary, args, {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  const stdout = String(result.stdout || "").trim();
  const stderr = String(result.stderr || "").trim();

  if (stdout) {
    console.log(stdout);
  }

  if (stderr) {
    console.error(stderr);
  }

  if (result.status === 0) {
    return [stdout, stderr].filter(Boolean).join("\n");
  }

  fail([
    "clasp command failed.",
    `Command: ${printableCommand}`,
  ]);

  process.exit(result.status || 1);
}

function printSummary({
  createNewDeployment,
  configuredDeploymentId,
  deployOutput,
  description,
}) {
  const detectedDeploymentId = extractDeploymentId(deployOutput);
  const detectedWebAppUrl = extractWebAppUrl(deployOutput);

  const lines = [
    "",
    createNewDeployment ? "Deployment created." : "Deployment updated.",
    `Description: ${description}`,
  ];

  if (configuredDeploymentId) {
    lines.push(`Deployment ID: ${configuredDeploymentId}`);
  }

  if (createNewDeployment && detectedDeploymentId) {
    lines.push(`New deployment ID: ${detectedDeploymentId}`);
  }

  if (detectedWebAppUrl) {
    lines.push(`Web app URL: ${detectedWebAppUrl}`);
  }

  if (createNewDeployment) {
    lines.push(
      `Save the deployment ID in ${DEPLOY_CONFIG_NAME} so future deploys keep the same web app URL.`,
    );
  }

  console.log(lines.join("\n"));
}

function extractDeploymentId(text) {
  const match = String(text || "").match(/deployment(?:\s+id)?[:\s]+([a-z0-9_-]{10,})/i);
  return match ? match[1] : "";
}

function extractWebAppUrl(text) {
  const match = String(text || "").match(/https:\/\/script\.google\.com\/macros\/s\/[^\s]+/i);
  return match ? match[0] : "";
}

function fail(lines) {
  console.error(lines.join("\n"));
}
