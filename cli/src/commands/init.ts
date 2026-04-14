// cli/src/commands/init.ts
import { Command } from 'commander';
import { basename, join, resolve, dirname } from 'node:path';
import { existsSync, mkdirSync, cpSync, writeFileSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createClient, initSchema, SQLiteAdapter, writeConfig } from '@demiurge/core';
import type { DemiurgeConfig, ExecutorType } from '@demiurge/core';
import { randomUUID } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

// Find the demiurge package root (where agents/ directory lives)
function findPackageRoot(): string {
  let dir = dirname(new URL(import.meta.url).pathname);
  while (dir !== '/') {
    if (existsSync(join(dir, 'agents')) && existsSync(join(dir, 'package.json'))) {
      return dir;
    }
    dir = dirname(dir);
  }
  throw new Error('Cannot find demiurge package root. Is the package installed correctly?');
}

function walkFiles(dir: string, prefix = ''): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.') && entry !== '.gitignore' && entry !== '.gitkeep') continue;
    const full = join(dir, entry);
    const rel = prefix ? `${prefix}/${entry}` : entry;
    if (statSync(full).isDirectory()) {
      results.push(...walkFiles(full, rel));
    } else {
      results.push(rel);
    }
  }
  return results;
}

interface InitOptions {
  project?: string;
  executor?: ExecutorType;
  ui?: boolean;
  yes?: boolean;
  force?: boolean;
  dryRun?: boolean;
}

export function initProject(targetDir: string, options: InitOptions): void {
  const pkgRoot = findPackageRoot();
  const projectName = options.project ?? basename(targetDir);

  // 1. Create .demiurge directory
  const demiurgeDir = join(targetDir, '.demiurge');
  mkdirSync(demiurgeDir, { recursive: true });

  // 2. Copy agent prompts -> agents/
  const agentsSource = join(pkgRoot, 'agents');
  const agentsTarget = join(targetDir, 'agents');
  if (!existsSync(agentsTarget) || options.force) {
    for (const entry of readdirSync(agentsSource)) {
      // Skip hidden files and internal dirs (_docs, _shared, _scaffold, _design-system)
      if (entry.startsWith('.') || entry.startsWith('_')) continue;
      const src = join(agentsSource, entry);
      const dest = join(agentsTarget, entry);
      if (statSync(src).isDirectory()) {
        cpSync(src, dest, { recursive: true, force: options.force });
      }
    }
  }

  // 3. Copy shared resources -> .claude/
  const sharedSource = join(agentsSource, '_shared');
  if (existsSync(sharedSource)) {
    const claudeDir = join(targetDir, '.claude');
    for (const f of walkFiles(sharedSource)) {
      const src = join(sharedSource, f);
      const dest = join(claudeDir, f);
      mkdirSync(dirname(dest), { recursive: true });
      cpSync(src, dest, { force: options.force });
    }
  }

  // 4. Copy doc templates -> docs/
  const docsSource = join(agentsSource, '_docs');
  if (existsSync(docsSource)) {
    for (const f of walkFiles(docsSource)) {
      const src = join(docsSource, f);
      const dest = join(targetDir, 'docs', f);
      mkdirSync(dirname(dest), { recursive: true });
      cpSync(src, dest, { force: options.force });
    }
  }

  // 5. Write demiurge.config.json
  const config: DemiurgeConfig = {
    executor: options.executor ?? 'claude-code',
    model: 'opus',
    agents: {
      pm: { model: 'opus' },
      reviewer: { model: 'opus' },
      designer: { model: 'sonnet' },
      frontend: { model: 'sonnet' },
      backend: { model: 'sonnet' },
    },
  };
  writeConfig(targetDir, config);

  // 6. Initialize SQLite DB
  const dbPath = join(demiurgeDir, 'data.db');
  const db = createClient(dbPath);
  initSchema(db);
  const adapter = new SQLiteAdapter(db);
  adapter.createProject({
    id: randomUUID(),
    name: projectName,
    path: targetDir,
    created_at: new Date().toISOString(),
  });
  db.close();

  console.log(`\nDemiurge initialized in ${targetDir}`);
  console.log(`\n  Project:  ${projectName}`);
  console.log(`  Executor: ${config.executor}`);
  console.log(`  Database: .demiurge/data.db`);
  console.log(`\nNext steps:`);
  console.log(`  1. Drop project materials into docs/intake/`);
  console.log(`  2. demiurge intake docs/intake/* --run-pm`);
  console.log(`  3. demiurge task list`);
  if (options.ui) {
    console.log(`  4. demiurge ui`);
  }
}

export function createInitCommand(): Command {
  const cmd = new Command('init')
    .description('Initialize demiurge in current directory')
    .option('--project <name>', 'Project name')
    .option('--executor <type>', 'Executor type (claude-code, codex)', 'claude-code')
    .option('--ui', 'Enable UI dashboard')
    .option('--force', 'Overwrite existing files')
    .option('--dry-run', 'Preview without writing')
    .option('-y, --yes', 'Skip prompts, use defaults')
    .action(async (opts) => {
      const targetDir = resolve(process.cwd());

      if (!opts.yes && !opts.project) {
        const rl = createInterface({ input, output });
        try {
          const name = await rl.question(`Project name (${basename(targetDir)}): `);
          opts.project = name.trim() || basename(targetDir);
        } finally {
          rl.close();
        }
      }

      initProject(targetDir, opts);
    });

  return cmd;
}
