import { test, expect, afterEach } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import { regenerateWorkspace } from "../../src/lib/role-card.js";
import { makeFixture, cleanup } from "../helpers/scaffold-fixture.js";

let root;
afterEach(async () => {
  if (root) {
    await cleanup(root);
    root = null;
  }
});

test("regenerateWorkspace replaces empty marker section with bullets", async () => {
  root = await makeFixture({
    withApps: [
      { name: "landing", role: "frontend" },
      { name: "admin", role: "frontend" },
      { name: "api", role: "backend" },
    ],
  });
  await regenerateWorkspace(root, "frontend");
  const text = await fs.readFile(path.join(root, "docs", "roles", "frontend.md"), "utf8");
  expect(text).toContain("- `apps/landing/`");
  expect(text).toContain("- `apps/admin/`");
  expect(text).not.toContain("- `apps/api/`");
  expect(text).not.toContain("_No apps yet._");
});

test("regenerateWorkspace writes empty-state when no apps for that role", async () => {
  root = await makeFixture({ withApps: [{ name: "api", role: "backend" }] });
  await regenerateWorkspace(root, "frontend");
  const text = await fs.readFile(path.join(root, "docs", "roles", "frontend.md"), "utf8");
  expect(text).toContain("_No apps yet._");
});

test("regenerateWorkspace throws clearly if markers missing", async () => {
  root = await makeFixture();
  await fs.writeFile(
    path.join(root, "docs", "roles", "frontend.md"),
    "# frontend\n\nNo markers here.\n",
  );
  await expect(regenerateWorkspace(root, "frontend")).rejects.toThrow(/apps:start/);
});
