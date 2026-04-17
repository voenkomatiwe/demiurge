import { test, expect, afterEach } from "bun:test";
import path from "node:path";
import { findProjectRoot } from "../../src/lib/paths.js";
import { makeFixture, cleanup } from "../helpers/scaffold-fixture.js";

let root;
afterEach(async () => {
  if (root) {
    await cleanup(root);
    root = null;
  }
});

test("findProjectRoot returns root when passed the root itself", async () => {
  root = await makeFixture();
  expect(await findProjectRoot(root)).toBe(root);
});

test("findProjectRoot walks up from a nested dir", async () => {
  root = await makeFixture();
  const nested = path.join(root, "apps");
  expect(await findProjectRoot(nested)).toBe(root);
});

test("findProjectRoot throws when not inside a demiurge project", async () => {
  await expect(findProjectRoot("/tmp")).rejects.toThrow(/demiurge project/);
});
