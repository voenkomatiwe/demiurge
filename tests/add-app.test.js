import { test, expect, afterEach } from "bun:test";
import { validateAddApp } from "../src/add-app.js";
import { makeFixture, cleanup } from "./helpers/scaffold-fixture.js";

let root;
afterEach(async () => {
  if (root) {
    await cleanup(root);
    root = null;
  }
});

test("validateAddApp: happy path (frontend)", async () => {
  root = await makeFixture();
  await expect(
    validateAddApp(root, { name: "landing", role: "frontend" }),
  ).resolves.toBeUndefined();
});

test("validateAddApp: rejects invalid name (uppercase)", async () => {
  root = await makeFixture();
  await expect(
    validateAddApp(root, { name: "Landing", role: "frontend" }),
  ).rejects.toThrow(/name must match/);
});

test("validateAddApp: rejects invalid name (starts with digit)", async () => {
  root = await makeFixture();
  await expect(
    validateAddApp(root, { name: "1landing", role: "frontend" }),
  ).rejects.toThrow(/name must match/);
});

test("validateAddApp: rejects reserved name", async () => {
  root = await makeFixture();
  await expect(
    validateAddApp(root, { name: "readme", role: "frontend" }),
  ).rejects.toThrow(/reserved/);
});

test("validateAddApp: rejects non-code role", async () => {
  root = await makeFixture();
  await expect(
    validateAddApp(root, { name: "x", role: "designer" }),
  ).rejects.toThrow(/role .* does not own apps/);
});

test("validateAddApp: rejects role whose domain was pruned", async () => {
  root = await makeFixture();
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  await fs.rm(path.join(root, "docs", "contracts"), { recursive: true, force: true });
  await expect(
    validateAddApp(root, { name: "vault", role: "smartcontract" }),
  ).rejects.toThrow(/domain .* not present/);
});

test("validateAddApp: rejects duplicate name", async () => {
  root = await makeFixture({ withApps: [{ name: "landing", role: "frontend" }] });
  await expect(
    validateAddApp(root, { name: "landing", role: "frontend" }),
  ).rejects.toThrow(/already exists/);
});

import fs from "node:fs/promises";
import path from "node:path";
import { runAddApp } from "../src/add-app.js";

// --- Helper: populate a scratch "template root" in a sibling tempdir ---
async function seedAppTemplate(root) {
  const base = path.dirname(root);
  const tpl = await fs.mkdtemp(path.join(base, "demiurge-tpl-"));
  await fs.mkdir(path.join(tpl, "_app-template", "apps"), { recursive: true });
  await fs.mkdir(path.join(tpl, "_app-template", "docs", "web"), { recursive: true });
  await fs.mkdir(path.join(tpl, "_app-template", "docs", "contracts"), { recursive: true });
  await fs.writeFile(
    path.join(tpl, "_app-template", "apps", "README.md"),
    "# {{NAME}}\n\nRole: {{ROLE}}\nDomain: {{DOMAIN}}\n",
  );
  await fs.writeFile(
    path.join(tpl, "_app-template", "docs", "web", "architecture.md"),
    "# Architecture\n",
  );
  await fs.writeFile(
    path.join(tpl, "_app-template", "docs", "web", "api.md"),
    "# API\n",
  );
  await fs.writeFile(
    path.join(tpl, "_app-template", "docs", "web", "data-model.md"),
    "# Data model\n",
  );
  await fs.writeFile(
    path.join(tpl, "_app-template", "docs", "contracts", "architecture.md"),
    "# On-chain architecture\n",
  );
  await fs.writeFile(
    path.join(tpl, "_app-template", "docs", "contracts", "interfaces.md"),
    "# Interfaces\n",
  );
  return tpl;
}

test("runAddApp (frontend): creates all expected files", async () => {
  root = await makeFixture();
  const tpl = await seedAppTemplate(root);
  process.env.DEMIURGE_TEMPLATE_ROOT = tpl;
  try {
    await runAddApp({ name: "landing", role: "frontend", cwd: root });

    const appReadme = await fs.readFile(
      path.join(root, "apps", "landing", "README.md"),
      "utf8",
    );
    expect(appReadme).toContain("landing");
    expect(appReadme).toContain("frontend");
    expect(appReadme).toContain("web");

    const arch = await fs.readFile(
      path.join(root, "docs", "apps", "landing", "architecture.md"),
      "utf8",
    );
    expect(arch).toContain("Architecture");

    await expect(
      fs.access(path.join(root, "docs", "apps", "landing", "api.md")),
    ).rejects.toThrow();

    const yml = await fs.readFile(path.join(root, ".demiurge", "apps.yml"), "utf8");
    expect(yml).toContain("name: landing");

    const idx = await fs.readFile(path.join(root, "apps", "README.md"), "utf8");
    expect(idx).toContain("| landing | frontend |");

    const labels = await fs.readFile(path.join(root, ".github", "labels.yml"), "utf8");
    expect(labels).toContain('"area:apps/landing"');

    const co = await fs.readFile(path.join(root, "CODEOWNERS"), "utf8");
    expect(co).toContain("/apps/landing/");

    const card = await fs.readFile(
      path.join(root, "docs", "roles", "frontend.md"),
      "utf8",
    );
    expect(card).toContain("- `apps/landing/`");
  } finally {
    delete process.env.DEMIURGE_TEMPLATE_ROOT;
    await fs.rm(tpl, { recursive: true, force: true });
  }
});

test("runAddApp (backend): creates api.md + data-model.md", async () => {
  root = await makeFixture();
  const tpl = await seedAppTemplate(root);
  process.env.DEMIURGE_TEMPLATE_ROOT = tpl;
  try {
    await runAddApp({ name: "api", role: "backend", cwd: root });
    await fs.access(path.join(root, "docs", "apps", "api", "architecture.md"));
    await fs.access(path.join(root, "docs", "apps", "api", "api.md"));
    await fs.access(path.join(root, "docs", "apps", "api", "data-model.md"));
  } finally {
    delete process.env.DEMIURGE_TEMPLATE_ROOT;
    await fs.rm(tpl, { recursive: true, force: true });
  }
});

test("runAddApp (smartcontract): uses contracts architecture template + interfaces.md", async () => {
  root = await makeFixture();
  const tpl = await seedAppTemplate(root);
  process.env.DEMIURGE_TEMPLATE_ROOT = tpl;
  try {
    await runAddApp({ name: "vault", role: "smartcontract", cwd: root });
    const arch = await fs.readFile(
      path.join(root, "docs", "apps", "vault", "architecture.md"),
      "utf8",
    );
    expect(arch).toContain("On-chain architecture");
    await fs.access(path.join(root, "docs", "apps", "vault", "interfaces.md"));
  } finally {
    delete process.env.DEMIURGE_TEMPLATE_ROOT;
    await fs.rm(tpl, { recursive: true, force: true });
  }
});

test("runAddApp: validation failure leaves repo untouched", async () => {
  root = await makeFixture();
  const tpl = await seedAppTemplate(root);
  process.env.DEMIURGE_TEMPLATE_ROOT = tpl;
  try {
    const before = await fs.readFile(path.join(root, ".demiurge", "apps.yml"), "utf8");
    await expect(
      runAddApp({ name: "Bad-Name", role: "frontend", cwd: root }),
    ).rejects.toThrow();
    const after = await fs.readFile(path.join(root, ".demiurge", "apps.yml"), "utf8");
    expect(after).toBe(before);
    const entries = await fs.readdir(path.join(root, "apps"));
    expect(entries).not.toContain("Bad-Name");
  } finally {
    delete process.env.DEMIURGE_TEMPLATE_ROOT;
    await fs.rm(tpl, { recursive: true, force: true });
  }
});
