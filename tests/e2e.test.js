import { test, expect } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const cli = path.join(repo, "bin", "create-demiurge.js");

function run(args, cwd) {
  const r = spawnSync("node", [cli, ...args], { cwd, encoding: "utf8" });
  if (r.status !== 0) {
    throw new Error(`CLI failed (${args.join(" ")}): ${r.stderr}\n${r.stdout}`);
  }
  return r;
}

test("e2e: scaffold → add frontend → add backend → state is consistent", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "demiurge-e2e-"));
  const project = path.join(tmp, "proj");
  try {
    run([project, "--no-setup", "--no-git", "--force"], tmp);

    // Verify scaffold shape
    await fs.access(path.join(project, ".demiurge", "apps.yml"));
    await fs.access(path.join(project, "apps", "README.md"));
    await fs.access(path.join(project, "docs", "apps"));

    // Add frontend app
    run(["add", "app", "landing", "--role=frontend"], project);
    await fs.access(path.join(project, "apps", "landing", "README.md"));
    await fs.access(path.join(project, "docs", "apps", "landing", "architecture.md"));

    // Add backend app
    run(["add", "app", "api", "--role=backend"], project);
    await fs.access(path.join(project, "docs", "apps", "api", "api.md"));
    await fs.access(path.join(project, "docs", "apps", "api", "data-model.md"));

    // Registry
    const yml = await fs.readFile(path.join(project, ".demiurge", "apps.yml"), "utf8");
    expect(yml).toContain("name: landing");
    expect(yml).toContain("name: api");

    // Index
    const idx = await fs.readFile(path.join(project, "apps", "README.md"), "utf8");
    expect(idx).toContain("| landing | frontend |");
    expect(idx).toContain("| api | backend |");

    // Labels
    const labels = await fs.readFile(path.join(project, ".github", "labels.yml"), "utf8");
    expect(labels).toContain('"area:apps/landing"');
    expect(labels).toContain('"area:apps/api"');

    // CODEOWNERS
    const co = await fs.readFile(path.join(project, "CODEOWNERS"), "utf8");
    expect(co).toContain("/apps/landing/");
    expect(co).toContain("/apps/api/");

    // Role cards
    const feCard = await fs.readFile(path.join(project, "docs", "roles", "frontend.md"), "utf8");
    expect(feCard).toContain("- `apps/landing/`");
    expect(feCard).not.toContain("- `apps/api/`");
    const beCard = await fs.readFile(path.join(project, "docs", "roles", "backend.md"), "utf8");
    expect(beCard).toContain("- `apps/api/`");
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
}, 30_000);

test("e2e: duplicate add-app fails with clear message", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "demiurge-e2e-"));
  const project = path.join(tmp, "proj");
  try {
    run([project, "--no-setup", "--no-git", "--force"], tmp);
    run(["add", "app", "landing", "--role=frontend"], project);
    const r = spawnSync("node", [cli, "add", "app", "landing", "--role=frontend"], {
      cwd: project,
      encoding: "utf8",
    });
    expect(r.status).not.toBe(0);
    expect(r.stderr + r.stdout).toMatch(/already exists/);
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
}, 30_000);
