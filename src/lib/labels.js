import fs from "node:fs/promises";
import path from "node:path";

const LABELS = path.join(".github", "labels.yml");

const ROLE_COLOR = {
  frontend: "BFD4F2",
  backend: "0E8A16",
  smartcontract: "5319E7",
};

export async function appendAppLabel(root, { name, role }) {
  const labelName = `area:apps/${name}`;
  const file = path.join(root, LABELS);
  const current = await fs.readFile(file, "utf8");
  if (current.includes(`"${labelName}"`)) {
    throw new Error(`Label "${labelName}" already present in ${LABELS}`);
  }
  const color = ROLE_COLOR[role];
  if (!color) throw new Error(`No color mapping for role "${role}"`);
  const block =
    `- name: "${labelName}"\n` +
    `  color: "${color}"\n` +
    `  description: "Scope: apps/${name}"\n`;
  const needsNewline = current.length > 0 && !current.endsWith("\n");
  await fs.writeFile(file, current + (needsNewline ? "\n" : "") + block);
}
