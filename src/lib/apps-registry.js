import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";

const REGISTRY = path.join(".demiurge", "apps.yml");
const INDEX = path.join("apps", "README.md");

export async function readRegistry(root) {
  const raw = await fs.readFile(path.join(root, REGISTRY), "utf8");
  const parsed = yaml.load(raw) || {};
  if (!Array.isArray(parsed.apps)) return { apps: [] };
  return { apps: parsed.apps };
}

async function writeRegistry(root, reg) {
  const header =
    "# Registry of apps in this project. Managed by `demiurge add app`.\n" +
    "# Source of truth — regenerate apps/README.md if edited by hand.\n";
  const body =
    reg.apps.length === 0
      ? "apps: []\n"
      : yaml.dump({ apps: reg.apps }, { lineWidth: 100 });
  await fs.writeFile(path.join(root, REGISTRY), header + body);
}

export async function appendApp(root, { name, role, created }) {
  const reg = await readRegistry(root);
  if (reg.apps.some((a) => a.name === name)) {
    throw new Error(`App "${name}" already exists in ${REGISTRY}`);
  }
  reg.apps.push({ name, role, docs: `docs/apps/${name}/`, created });
  await writeRegistry(root, reg);
  await fs.writeFile(path.join(root, INDEX), renderIndex(reg));
  return reg;
}

export function renderIndex(reg) {
  const hint = "To add a new app: `bun x demiurge add app <name> --role=<role>`\n";
  if (reg.apps.length === 0) {
    return `# Apps\n\nNo apps yet.\n\n${hint}`;
  }
  const rows = reg.apps
    .map((a) => `| ${a.name} | ${a.role} | [${a.docs}](../${a.docs}) |`)
    .join("\n");
  return `# Apps\n\n| App | Role | Docs |\n|-----|------|------|\n${rows}\n\n${hint}`;
}
