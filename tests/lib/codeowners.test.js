import { test, expect, afterEach } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import { appendAppCodeowners } from "../../src/lib/codeowners.js";
import { makeFixture, cleanup } from "../helpers/scaffold-fixture.js";

let root;
afterEach(async () => {
  if (root) {
    await cleanup(root);
    root = null;
  }
});

test("appendAppCodeowners adds two placeholder lines tied to role", async () => {
  root = await makeFixture();
  await appendAppCodeowners(root, { name: "landing", role: "frontend" });
  const text = await fs.readFile(path.join(root, "CODEOWNERS"), "utf8");
  expect(text).toContain("/apps/landing/");
  expect(text).toContain("/docs/apps/landing/");
  expect(text).toContain("role:frontend");
  expect(text).toContain(".demiurge/team.yml");
});

test("appendAppCodeowners throws if lines already present", async () => {
  root = await makeFixture();
  await appendAppCodeowners(root, { name: "landing", role: "frontend" });
  await expect(
    appendAppCodeowners(root, { name: "landing", role: "frontend" }),
  ).rejects.toThrow(/already/);
});
