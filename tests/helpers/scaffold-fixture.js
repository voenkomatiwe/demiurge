import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

/**
 * Creates a minimal fake demiurge project in a temp dir.
 * Returns the absolute path. Caller is responsible for rm -rf (use `cleanup`).
 */
export async function makeFixture({ withApps = [] } = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "demiurge-test-"));
  await fs.mkdir(path.join(root, ".demiurge"), { recursive: true });
  await fs.mkdir(path.join(root, "apps"), { recursive: true });
  await fs.mkdir(path.join(root, "docs", "apps"), { recursive: true });
  await fs.mkdir(path.join(root, "docs", "web"), { recursive: true });
  await fs.mkdir(path.join(root, "docs", "contracts"), { recursive: true });
  await fs.mkdir(path.join(root, "docs", "roles"), { recursive: true });
  await fs.mkdir(path.join(root, ".github"), { recursive: true });

  const appsYml =
    withApps.length === 0
      ? "apps: []\n"
      : "apps:\n" +
        withApps
          .map(
            (a) =>
              `  - name: ${a.name}\n    role: ${a.role}\n    docs: docs/apps/${a.name}/\n    created: 2026-01-01\n`,
          )
          .join("");
  await fs.writeFile(path.join(root, ".demiurge", "apps.yml"), appsYml);

  await fs.writeFile(
    path.join(root, ".github", "labels.yml"),
    '- name: "role:frontend"\n  color: "FEF2C0"\n',
  );
  await fs.writeFile(path.join(root, "CODEOWNERS"), "# CODEOWNERS\n");
  await fs.writeFile(path.join(root, "apps", "README.md"), "# apps\n");

  // Minimal role cards with workspace markers
  for (const role of ["frontend", "backend", "smartcontract"]) {
    await fs.writeFile(
      path.join(root, "docs", "roles", `${role}.md`),
      `# ${role}\n\n## Your workspace\n\n<!-- apps:start -->\n_No apps yet._\n<!-- apps:end -->\n`,
    );
  }

  return root;
}

export async function cleanup(root) {
  await fs.rm(root, { recursive: true, force: true });
}
