import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readRegistry, appendApp } from "./lib/apps-registry.js";
import { appendAppLabel } from "./lib/labels.js";
import { appendAppCodeowners } from "./lib/codeowners.js";
import { regenerateWorkspace } from "./lib/role-card.js";
import { findProjectRoot } from "./lib/paths.js";

const NAME_RE = /^[a-z][a-z0-9-]*$/;
const RESERVED = new Set(["readme", "_templates", "_app-template"]);

const ROLE_TO_DOMAIN = {
  frontend: "web",
  backend: "web",
  smartcontract: "contracts",
};

const ROLE_TO_DOC_FILES = {
  frontend: ["architecture.md"],
  backend: ["architecture.md", "api.md", "data-model.md"],
  smartcontract: ["architecture.md", "interfaces.md"],
};

async function dirExists(p) {
  try {
    const s = await fs.stat(p);
    return s.isDirectory();
  } catch {
    return false;
  }
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function validateAddApp(root, { name, role }) {
  if (!NAME_RE.test(name)) throw new Error(`App name must match ${NAME_RE} (got "${name}")`);
  if (RESERVED.has(name.toLowerCase())) throw new Error(`App name "${name}" is reserved`);
  const domain = ROLE_TO_DOMAIN[role];
  if (!domain) {
    throw new Error(
      `role "${role}" does not own apps (allowed: ${Object.keys(ROLE_TO_DOMAIN).join(", ")})`,
    );
  }
  if (!(await dirExists(path.join(root, "docs", domain)))) {
    throw new Error(`role "${role}" requires domain "${domain}" but docs/${domain}/ not present`);
  }
  const { apps } = await readRegistry(root);
  if (apps.some((a) => a.name === name)) throw new Error(`App "${name}" already exists`);
}

function getTemplateRoot() {
  if (process.env.DEMIURGE_TEMPLATE_ROOT) return process.env.DEMIURGE_TEMPLATE_ROOT;
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "..", "template");
}

// Future: accept --template=<nextjs-app|fastify-api|grammy-bot|foundry-contracts>
// to copy a richer starter into apps/<name>/. For now, only the bare README.
async function renderAppReadme(name, role, domain) {
  const tpl = path.join(getTemplateRoot(), "_app-template", "apps", "README.md");
  const raw = await fs.readFile(tpl, "utf8");
  return raw
    .replaceAll("{{NAME}}", name)
    .replaceAll("{{ROLE}}", role)
    .replaceAll("{{DOMAIN}}", domain);
}

export async function runAddApp({ name, role, cwd = process.cwd() }) {
  const root = await findProjectRoot(cwd);
  await validateAddApp(root, { name, role });
  const domain = ROLE_TO_DOMAIN[role];

  // --- Stage: read all templates up-front. Any missing file fails before side effects. ---
  const appReadme = await renderAppReadme(name, role, domain);

  const docFiles = ROLE_TO_DOC_FILES[role];
  const docContents = {};
  // architecture.md and domain-specific files come from the domain template folder.
  // Extra files (api.md, data-model.md) live in the web template folder.
  const WEB_ONLY_FILES = new Set(["api.md", "data-model.md"]);
  for (const f of docFiles) {
    const subdomain = WEB_ONLY_FILES.has(f) ? "web" : domain;
    const src = path.join(getTemplateRoot(), "_app-template", "docs", subdomain, f);
    if (!(await fileExists(src))) {
      throw new Error(`Template file missing: ${src}`);
    }
    docContents[f] = await fs.readFile(src, "utf8");
  }

  const today = new Date().toISOString().slice(0, 10);

  // --- Write phase. Validation has already succeeded; these are the side effects. ---
  await fs.mkdir(path.join(root, "apps", name), { recursive: true });
  await fs.writeFile(path.join(root, "apps", name, "README.md"), appReadme);

  await fs.mkdir(path.join(root, "docs", "apps", name), { recursive: true });
  for (const f of docFiles) {
    await fs.writeFile(path.join(root, "docs", "apps", name, f), docContents[f]);
  }

  await appendApp(root, { name, role, created: today });
  await appendAppLabel(root, { name, role });
  await appendAppCodeowners(root, { name, role });
  await regenerateWorkspace(root, role);
}
