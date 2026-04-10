#!/usr/bin/env node
// create-claude-orchestrator
// Installs a Claude Code multi-agent orchestrator template into the current
// working directory. Zero runtime dependencies (pure Node ≥18).

import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const PACKAGE_ROOT = resolve(dirname(__filename), '..');

// Paths to copy from the package root into the target project.
// Keep in sync with package.json "files". Explicit allowlist — do NOT
// wildcard .claude/skills/ because developers often install unrelated
// tool-specific skills there.
const TEMPLATE_PATHS = [
  '.claude/agents',
  '.claude/hooks',
  '.claude/rules',
  '.claude/instincts',
  '.claude/skills/analyze-repo',
  '.claude/skills/context-budget',
  '.claude/skills/multi-execute',
  '.claude/skills/security-scan',
  '.claude/skills/decompose',
  '.claude/skills/review-task',
  '.claude/skills/task-status',
  '.claude/settings.json',
  'docs/ARCHITECTURE.md',
  'docs/DECISIONS.md',
  'docs/MEMORY_BANK.md',
  'docs/WORKFLOW.md',
  'docs/tasks/_TEMPLATE.md',
  'docs/tasks/_TEMPLATE-SPEC.md',
  'scripts/run-agent.sh',
  'scripts/convert.sh',
  'CLAUDE.md',
];

// Files where {{PROJECT_NAME}} / {{PROJECT_DESCRIPTION}} placeholders are replaced
// during install.
const TEMPLATED_FILES = [
  'CLAUDE.md',
  'docs/ARCHITECTURE.md',
  'docs/MEMORY_BANK.md',
];

const HELP = `
create-claude-orchestrator — install a Claude Code multi-agent orchestrator template

Usage:
  npx create-claude-orchestrator [options]

Options:
  --project <name>         Project name (default: current directory name)
  --description <text>     One-line project description
  --force                  Overwrite existing files if they exist
  --dry-run                Print what would be copied, do nothing
  --yes, -y                Skip prompts, use defaults
  --help, -h               Show this help

What it installs:
  .claude/agents/          5 specialist agents (pm, reviewer, designer, frontend, backend)
  .claude/hooks/           SessionStart, scope-check, SessionStop, protect-files
  .claude/rules/           security, coding-style, agent-behavior
  .claude/skills/          context-budget, analyze-repo, multi-execute, security-scan
  .claude/settings.json    Hook registrations
  docs/ARCHITECTURE.md     Skeleton for your architecture
  docs/DECISIONS.md        YAML decisions log starter
  docs/MEMORY_BANK.md      Persistent state (survives /compact)
  docs/WORKFLOW.md         How the orchestrator works
  docs/tasks/_TEMPLATE*    Task file templates
  scripts/run-agent.sh     Launch a specialist on a task
  scripts/convert.sh       Export agents to .agents/ and .codex/
  CLAUDE.md                Project root context

After install:
  1. Edit CLAUDE.md — fill in your project name, stack, conventions
  2. Create your first task:
       cp docs/tasks/_TEMPLATE.md docs/tasks/TASK-001.md
  3. Run Claude:
       claude
       > use the pm agent to analyze docs/tasks/TASK-001.md
`;

function parseArgs(argv) {
  const args = { force: false, yes: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case 'init':
        // Optional positional — ignored
        break;
      case '--force':
        args.force = true;
        break;
      case '--dry-run':
        args.dryRun = true;
        break;
      case '--yes':
      case '-y':
        args.yes = true;
        break;
      case '--project':
        args.project = argv[++i];
        break;
      case '--description':
        args.description = argv[++i];
        break;
      case '--help':
      case '-h':
        console.log(HELP);
        process.exit(0);
      default:
        if (a.startsWith('--')) {
          console.error(`Unknown option: ${a}`);
          console.error('Run with --help for usage.');
          process.exit(2);
        }
    }
  }
  return args;
}

async function prompt(question, defaultValue) {
  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question(
      `${question}${defaultValue ? ` (${defaultValue})` : ''}: `,
    );
    return answer.trim() || defaultValue || '';
  } finally {
    rl.close();
  }
}

function findConflicts(targetDir) {
  return TEMPLATE_PATHS.filter((p) => existsSync(join(targetDir, p)));
}

function copyTemplate(targetDir, dryRun) {
  const copied = [];
  const skipped = [];
  for (const p of TEMPLATE_PATHS) {
    const src = join(PACKAGE_ROOT, p);
    const dest = join(targetDir, p);
    if (!existsSync(src)) {
      skipped.push(`${p} (missing in package)`);
      continue;
    }
    if (dryRun) {
      copied.push(p);
      continue;
    }
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(src, dest, { recursive: true, preserveTimestamps: true });
    copied.push(p);
  }
  return { copied, skipped };
}

function applyTemplates(targetDir, vars) {
  for (const rel of TEMPLATED_FILES) {
    const full = join(targetDir, rel);
    if (!existsSync(full)) continue;
    let content = readFileSync(full, 'utf8');
    for (const [key, value] of Object.entries(vars)) {
      content = content.replaceAll(`{{${key}}}`, value);
    }
    writeFileSync(full, content);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const targetDir = process.cwd();

  console.log(`create-claude-orchestrator → ${targetDir}`);

  // Conflict check
  const conflicts = findConflicts(targetDir);
  if (conflicts.length > 0 && !args.force && !args.dryRun) {
    console.error('\nExisting files that would be overwritten:');
    for (const c of conflicts) console.error(`  ${c}`);
    console.error('\nPass --force to overwrite, or --dry-run to preview.');
    process.exit(1);
  }

  // Collect project metadata
  let projectName = args.project;
  let projectDescription = args.description;
  if (!args.yes && !args.dryRun) {
    if (!projectName) {
      projectName = await prompt('Project name', basename(targetDir));
    }
    if (!projectDescription) {
      projectDescription = await prompt(
        'Project description (one sentence)',
        'A software project',
      );
    }
  }
  projectName ||= basename(targetDir);
  projectDescription ||= 'A software project';

  // Copy
  const { copied, skipped } = copyTemplate(targetDir, args.dryRun);

  if (args.dryRun) {
    console.log('\nDry run — would copy:');
    copied.forEach((c) => console.log(`  ${c}`));
    if (skipped.length) {
      console.log('\nSkipped:');
      skipped.forEach((s) => console.log(`  ${s}`));
    }
    return;
  }

  // Placeholder substitution
  applyTemplates(targetDir, {
    PROJECT_NAME: projectName,
    PROJECT_DESCRIPTION: projectDescription,
  });

  // Success output
  copied.forEach((c) => console.log(`  ✓ ${c}`));
  if (skipped.length) {
    console.log('\nSkipped:');
    skipped.forEach((s) => console.log(`  - ${s}`));
  }

  console.log(`
Installed in ${targetDir}

Next steps:
  1. Edit CLAUDE.md — add stack details, conventions for your project
  2. Create your first task:
       cp docs/tasks/_TEMPLATE.md docs/tasks/TASK-001.md
  3. Run Claude:
       claude
       > use the pm agent to analyze docs/tasks/TASK-001.md
`);
}

main().catch((err) => {
  console.error('Install failed:', err.message || err);
  process.exit(1);
});
