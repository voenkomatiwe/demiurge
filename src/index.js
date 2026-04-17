import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import prompts from "prompts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.resolve(__dirname, "..", "template");

const c = {
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
};
const info = (s) => console.log(`${c.cyan("→")} ${s}`);
const ok = (s) => console.log(`${c.green("✓")} ${s}`);
const err = (s) => console.error(`${c.red("✗")} ${s}`);

function parseArgs(argv) {
  const args = { _: [], flags: {} };
  for (const a of argv) {
    if (a === "--help" || a === "-h") args.flags.help = true;
    else if (a === "--force" || a === "-f") args.flags.force = true;
    else if (a === "--no-setup") args.flags.noSetup = true;
    else if (a === "--no-git") args.flags.noGit = true;
    else if (a.startsWith("-")) {
      err(`Unknown flag: ${a}`);
      printHelp();
      process.exit(1);
    } else args._.push(a);
  }
  return args;
}

function printHelp() {
  console.log(`
${c.bold("create-demiurge")} — scaffold a docs-first GitHub-native project.

${c.bold("Usage")}
  ${c.cyan("bun create demiurge")} ${c.dim("[<target-dir>] [options]")}
  ${c.cyan("npm create demiurge@latest")} ${c.dim("[<target-dir>] [options]")}
  ${c.cyan("pnpm create demiurge")} ${c.dim("[<target-dir>] [options]")}

${c.bold("Options")}
  ${c.dim("--force, -f")}     Overwrite non-empty target directory
  ${c.dim("--no-setup")}      Skip running setup.sh after scaffolding
  ${c.dim("--no-git")}        Skip ${c.cyan("git init")} in the new project
  ${c.dim("--help, -h")}      Show this help

${c.bold("Flow")}
  1. Copies template/ into <target-dir>
  2. Runs ${c.cyan("git init")} (unless --no-git)
  3. Runs ${c.cyan("./setup.sh")} interactively (unless --no-setup)
`);
}

async function dirExists(p) {
  try {
    const s = await fs.stat(p);
    return s.isDirectory();
  } catch {
    return false;
  }
}

async function dirIsEmpty(p) {
  const entries = await fs.readdir(p);
  return entries.filter((e) => e !== ".DS_Store").length === 0;
}

function run(cmd, args, cwd, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd,
      stdio: opts.silent ? "ignore" : "inherit",
      shell: false,
    });
    child.on("exit", (code) => {
      if (code === 0) resolve(code);
      else reject(new Error(`${cmd} ${args.join(" ")} exited with ${code}`));
    });
    child.on("error", reject);
  });
}

async function main() {
  const { _: positional, flags } = parseArgs(process.argv.slice(2));
  if (flags.help) {
    printHelp();
    return;
  }

  console.log();
  console.log(c.bold("create-demiurge"));
  console.log(c.dim("Docs-first, GitHub-native project template.\n"));

  let target = positional[0];
  if (!target) {
    const response = await prompts(
      {
        type: "text",
        name: "name",
        message: "Project directory",
        initial: "my-project",
        validate: (v) => (v && v.trim().length > 0 ? true : "Required"),
      },
      { onCancel: () => process.exit(1) },
    );
    target = response.name.trim();
  }

  const targetPath = path.resolve(process.cwd(), target);
  const relTarget = path.relative(process.cwd(), targetPath) || ".";

  if (await dirExists(targetPath)) {
    const empty = await dirIsEmpty(targetPath);
    if (!empty && !flags.force) {
      const { overwrite } = await prompts(
        {
          type: "confirm",
          name: "overwrite",
          message: `${c.yellow(relTarget)} is not empty. Remove existing files and continue?`,
          initial: false,
        },
        { onCancel: () => process.exit(1) },
      );
      if (!overwrite) {
        err("Aborted.");
        process.exit(1);
      }
    }
    if (!empty) {
      info("Clearing target directory...");
      for (const entry of await fs.readdir(targetPath)) {
        await fs.rm(path.join(targetPath, entry), { recursive: true, force: true });
      }
    }
  } else {
    await fs.mkdir(targetPath, { recursive: true });
  }

  info(`Scaffolding into ${c.bold(relTarget)}...`);
  await fs.cp(TEMPLATE_DIR, targetPath, { recursive: true });

  const gi = path.join(targetPath, "_gitignore");
  if (await fileExists(gi)) {
    await fs.rename(gi, path.join(targetPath, ".gitignore"));
  }

  const setupSh = path.join(targetPath, "setup.sh");
  if (await fileExists(setupSh)) {
    await fs.chmod(setupSh, 0o755);
  }

  ok("Template copied.");

  if (!flags.noGit) {
    info("Initializing git...");
    try {
      await run("git", ["init", "-q", "-b", "main"], targetPath, { silent: true });
      ok("git initialized.");
    } catch (e) {
      err(`git init failed: ${e.message}. Continuing without git.`);
    }
  }

  console.log();

  let runSetup = !flags.noSetup;
  if (runSetup && process.stdin.isTTY) {
    const { confirm } = await prompts(
      {
        type: "confirm",
        name: "confirm",
        message: "Run setup.sh now to fill placeholders and prune unused domains?",
        initial: true,
      },
      { onCancel: () => process.exit(1) },
    );
    runSetup = confirm;
  }

  if (runSetup) {
    console.log();
    info("Running setup.sh...\n");
    try {
      await run("bash", ["./setup.sh"], targetPath);
    } catch (e) {
      err(e.message);
      process.exit(1);
    }
  }

  console.log();
  console.log(c.bold("Next steps"));
  console.log(`  ${c.cyan("cd")} ${relTarget}`);
  if (!runSetup) console.log(`  ${c.cyan("./setup.sh")}`);
  console.log(`  ${c.cyan("git remote add origin")} <url>`);
  console.log(`  ${c.cyan("git push -u origin main")}`);
  console.log();
  console.log(c.dim("Read README.md and docs/roles/<your-role>.md to onboard."));
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

main().catch((e) => {
  err(e.stack || e.message);
  process.exit(1);
});
