import fs from "node:fs/promises";
import path from "node:path";
import { readRegistry } from "./apps-registry.js";

const START = "<!-- apps:start -->";
const END = "<!-- apps:end -->";

export async function regenerateWorkspace(root, role) {
  const file = path.join(root, "docs", "roles", `${role}.md`);
  const current = await fs.readFile(file, "utf8");
  const startIdx = current.indexOf(START);
  const endIdx = current.indexOf(END);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error(`Role card ${role}.md missing apps:start/apps:end markers`);
  }
  const { apps } = await readRegistry(root);
  const mine = apps.filter((a) => a.role === role);
  const body =
    mine.length === 0
      ? "_No apps yet._"
      : mine.map((a) => `- \`apps/${a.name}/\``).join("\n");
  const before = current.slice(0, startIdx + START.length);
  const after = current.slice(endIdx);
  await fs.writeFile(file, `${before}\n${body}\n${after}`);
}
