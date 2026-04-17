import { test, expect, afterEach } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import {
  readRegistry,
  appendApp,
  renderIndex,
} from "../../src/lib/apps-registry.js";
import { makeFixture, cleanup } from "../helpers/scaffold-fixture.js";

let root;
afterEach(async () => {
  if (root) {
    await cleanup(root);
    root = null;
  }
});

test("readRegistry returns {apps: []} on empty project", async () => {
  root = await makeFixture();
  expect(await readRegistry(root)).toEqual({ apps: [] });
});

test("readRegistry returns apps when present", async () => {
  root = await makeFixture({ withApps: [{ name: "landing", role: "frontend" }] });
  const reg = await readRegistry(root);
  expect(reg.apps).toHaveLength(1);
  expect(reg.apps[0].name).toBe("landing");
  expect(reg.apps[0].role).toBe("frontend");
});

test("appendApp adds entry and persists to disk", async () => {
  root = await makeFixture();
  await appendApp(root, { name: "api", role: "backend", created: "2026-04-17" });
  const yml = await fs.readFile(path.join(root, ".demiurge", "apps.yml"), "utf8");
  expect(yml).toContain("name: api");
  expect(yml).toContain("role: backend");
  expect(yml).toContain("docs: docs/apps/api/");
});

test("appendApp throws on duplicate name", async () => {
  root = await makeFixture({ withApps: [{ name: "landing", role: "frontend" }] });
  await expect(
    appendApp(root, { name: "landing", role: "frontend", created: "2026-04-17" }),
  ).rejects.toThrow(/already exists/);
});

test("renderIndex produces a markdown table from the registry", () => {
  const md = renderIndex({
    apps: [
      { name: "landing", role: "frontend", docs: "docs/apps/landing/" },
      { name: "api", role: "backend", docs: "docs/apps/api/" },
    ],
  });
  expect(md).toContain("| App | Role | Docs |");
  expect(md).toContain("| landing | frontend | [docs/apps/landing/](../docs/apps/landing/) |");
  expect(md).toContain("| api | backend | [docs/apps/api/](../docs/apps/api/) |");
  expect(md).toContain("bun x demiurge add app");
});

test("renderIndex produces an empty-state message when no apps", () => {
  const md = renderIndex({ apps: [] });
  expect(md).toContain("No apps yet");
  expect(md).toContain("bun x demiurge add app");
});
