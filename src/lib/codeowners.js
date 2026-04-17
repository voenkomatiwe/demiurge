import fs from "node:fs/promises";
import path from "node:path";

const FILE = "CODEOWNERS";

export async function appendAppCodeowners(root, { name, role }) {
  const file = path.join(root, FILE);
  const current = await fs.readFile(file, "utf8");
  const marker = `/apps/${name}/`;
  if (current.includes(marker)) {
    throw new Error(`CODEOWNERS already has entry for /apps/${name}/`);
  }
  const comment = `# role:${role} — owners will be set from .demiurge/team.yml (subsystem 2)`;
  const block =
    `/apps/${name}/        ${comment}\n` +
    `/docs/apps/${name}/   ${comment}\n`;
  const needsNewline = current.length > 0 && !current.endsWith("\n");
  await fs.writeFile(file, current + (needsNewline ? "\n" : "") + block);
}
