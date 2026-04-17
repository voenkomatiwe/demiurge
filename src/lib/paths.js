import fs from "node:fs/promises";
import path from "node:path";

const MARKER = path.join(".demiurge", "apps.yml");

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Walks up from `start` looking for .demiurge/apps.yml.
 * Throws if no such ancestor is found.
 */
export async function findProjectRoot(start) {
  let cur = path.resolve(start);
  while (true) {
    if (await exists(path.join(cur, MARKER))) return cur;
    const parent = path.dirname(cur);
    if (parent === cur) {
      throw new Error(
        `Not inside a demiurge project (no ${MARKER} found in any ancestor of ${start})`,
      );
    }
    cur = parent;
  }
}
