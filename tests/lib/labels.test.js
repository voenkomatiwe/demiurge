import { test, expect, afterEach } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import { appendAppLabel } from "../../src/lib/labels.js";
import { makeFixture, cleanup } from "../helpers/scaffold-fixture.js";

let root;
afterEach(async () => {
  if (root) {
    await cleanup(root);
    root = null;
  }
});

test("appendAppLabel adds area:apps/<name> with role-based color", async () => {
  root = await makeFixture();
  await appendAppLabel(root, { name: "landing", role: "frontend" });
  const yml = await fs.readFile(path.join(root, ".github", "labels.yml"), "utf8");
  expect(yml).toContain('- name: "area:apps/landing"');
  expect(yml).toContain('color: "BFD4F2"'); // frontend blue
  expect(yml).toContain('description: "Scope: apps/landing"');
});

test("appendAppLabel picks color by role", async () => {
  root = await makeFixture();
  await appendAppLabel(root, { name: "api", role: "backend" });
  await appendAppLabel(root, { name: "vault", role: "smartcontract" });
  const yml = await fs.readFile(path.join(root, ".github", "labels.yml"), "utf8");
  expect(yml).toMatch(/area:apps\/api[\s\S]+?0E8A16/);
  expect(yml).toMatch(/area:apps\/vault[\s\S]+?5319E7/);
});

test("appendAppLabel throws if label already present", async () => {
  root = await makeFixture();
  await appendAppLabel(root, { name: "landing", role: "frontend" });
  await expect(
    appendAppLabel(root, { name: "landing", role: "frontend" }),
  ).rejects.toThrow(/already/);
});
