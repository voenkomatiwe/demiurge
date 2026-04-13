#!/usr/bin/env node
// demiurge
// Installs a Claude Code multi-agent orchestrator template into the current
// working directory. Zero runtime dependencies (pure Node ≥18).

import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { emitKeypressEvents } from 'node:readline';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const PACKAGE_ROOT = resolve(dirname(__filename), '..');

// Minimal ANSI escape codes for the interactive selector. No dep.
const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  hideCursor: '\x1b[?25l',
  showCursor: '\x1b[?25h',
  clearBelow: '\x1b[J',
  up: (n) => `\x1b[${n}A`,
};

// Non-skill design-tool resources that live outside agents/.
// Keyed by --design choice; appended to the resolved path list.
const DESIGN_EXTRA_PATHS = {
  markdown: [
    { src: 'agents/_design-system/MASTER.md', dest: 'design-system/MASTER.md' },
    { src: 'agents/_design-system/pages/.gitkeep', dest: 'design-system/pages/.gitkeep' },
  ],
};

// Root-level project files (not inside agents/) that every install gets.
const ROOT_PATHS = [
  { src: 'CLAUDE.md', dest: 'CLAUDE.md' },
  { src: 'scripts/run-agent.sh', dest: 'scripts/run-agent.sh' },
  { src: 'scripts/convert.sh', dest: 'scripts/convert.sh' },
];

// ---------------------------------------------------------------------------
// Agent package discovery — reads agents/ folder structure at install time.
// Convention: agents/{name}/agent.md → .claude/agents/{name}.md
//             agents/{name}/skills/{skill}/ → .claude/skills/{skill}/
//             agents/_shared/* → .claude/*
//             agents/_docs/* → docs/*
//             agents/_scaffold/* → project root (prefix stripped)
// ---------------------------------------------------------------------------

// Parse conditional_skills from YAML frontmatter. Returns e.g.
// { pencil: ['pencil-design'], markdown: ['ui-ux-pro-max'] }
function parseConditionalSkills(agentMdPath) {
  const content = readFileSync(agentMdPath, 'utf8');
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return {};
  const fm = fmMatch[1];
  const csIdx = fm.indexOf('conditional_skills:');
  if (csIdx === -1) return {};
  const result = {};
  const lines = fm.slice(csIdx).split('\n').slice(1);
  let currentKey = null;
  for (const line of lines) {
    const keyMatch = line.match(/^\s{2}(\w[\w-]*):$/);
    const valueMatch = line.match(/^\s{4}-\s+(\S+)$/);
    if (keyMatch) {
      currentKey = keyMatch[1];
      result[currentKey] = [];
    } else if (valueMatch && currentKey) {
      result[currentKey].push(valueMatch[1]);
    } else if (!/^\s/.test(line)) {
      break; // left the conditional_skills block
    }
  }
  return result;
}

// Walk a directory recursively, returning relative paths of all files.
function walkFiles(dir, prefix = '') {
  const results = [];
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

// Build the full { src, dest } path list from the agents/ directory.
function discoverPaths(packageRoot, design) {
  const agentsDir = join(packageRoot, 'agents');
  const paths = [];

  // 1. Agent definitions + their skills
  for (const entry of readdirSync(agentsDir)) {
    if (entry.startsWith('_') || entry.startsWith('.')) continue;
    const entryPath = join(agentsDir, entry);
    if (!statSync(entryPath).isDirectory()) continue;
    const agentMd = join(entryPath, 'agent.md');
    if (!existsSync(agentMd)) continue;

    paths.push({
      src: `agents/${entry}/agent.md`,
      dest: `.claude/agents/${entry}.md`,
    });

    // Skills
    const skillsDir = join(entryPath, 'skills');
    if (existsSync(skillsDir)) {
      const conditional = parseConditionalSkills(agentMd);
      const allConditional = new Set(Object.values(conditional).flat());
      const allowed = new Set(conditional[design] || []);

      for (const skill of readdirSync(skillsDir)) {
        if (skill.startsWith('.')) continue;
        if (!statSync(join(skillsDir, skill)).isDirectory()) continue;
        // Skip conditional skills that don't match the chosen design tool
        if (allConditional.has(skill) && !allowed.has(skill)) continue;
        paths.push({
          src: `agents/${entry}/skills/${skill}`,
          dest: `.claude/skills/${skill}`,
        });
      }
    }

    // Agent-specific references (style guides, etc.)
    // Installed at the same path so agent.md references resolve correctly.
    const refsDir = join(entryPath, 'references');
    if (existsSync(refsDir)) {
      for (const f of walkFiles(refsDir)) {
        paths.push({
          src: `agents/${entry}/references/${f}`,
          dest: `agents/${entry}/references/${f}`,
        });
      }
    }

    // Agent-specific rules (if any)
    const rulesDir = join(entryPath, 'rules');
    if (existsSync(rulesDir)) {
      for (const f of walkFiles(rulesDir)) {
        paths.push({
          src: `agents/${entry}/rules/${f}`,
          dest: `.claude/rules/${f}`,
        });
      }
    }
  }

  // 2. Shared resources → .claude/
  const sharedDir = join(agentsDir, '_shared');
  if (existsSync(sharedDir)) {
    for (const f of walkFiles(sharedDir)) {
      paths.push({ src: `agents/_shared/${f}`, dest: `.claude/${f}` });
    }
  }

  // 3. Doc templates → docs/
  const docsDir = join(agentsDir, '_docs');
  if (existsSync(docsDir)) {
    for (const f of walkFiles(docsDir)) {
      paths.push({ src: `agents/_docs/${f}`, dest: `docs/${f}` });
    }
  }

  // 4. Scaffold → project root (prefix stripped)
  const scaffoldDir = join(agentsDir, '_scaffold');
  if (existsSync(scaffoldDir)) {
    for (const f of walkFiles(scaffoldDir)) {
      paths.push({ src: `agents/_scaffold/${f}`, dest: f });
    }
  }

  // 5. Root-level project files
  paths.push(...ROOT_PATHS);

  // 6. Design-tool-specific non-skill resources
  if (DESIGN_EXTRA_PATHS[design]) {
    paths.push(...DESIGN_EXTRA_PATHS[design]);
  }

  return paths;
}

// Discover which destination files need placeholder substitution.
// Any .md, .json, .yaml, or .sh file that lands in the target is a candidate.
const TEMPLATABLE_EXTS = new Set(['.md', '.json', '.yaml', '.yml', '.sh']);
function discoverTemplatedFiles(resolvedPaths) {
  return resolvedPaths
    .map(({ dest }) => dest)
    .filter((dest) => {
      const ext = dest.slice(dest.lastIndexOf('.'));
      return TEMPLATABLE_EXTS.has(ext);
    });
}

// Derivation table for package-manager-dependent commands.
// Demiurge ships a Bun workspaces monorepo; other managers are not supported
// by the scaffold at the moment. The placeholder mechanism is kept so a future
// release can re-introduce the choice without reshaping the installer.
// "run" = script runner (e.g. `bun run build`)
// "dlx" = one-off executor (e.g. `bunx shadcn`)
const PACKAGE_MANAGERS = {
  bun: { run: 'bun run', dlx: 'bunx' },
};

// Stack presets — user picks a label, we expand it to a human-readable stack line.
// Users who want something else can pick the free-text option during prompts.
const BACKEND_PRESETS = {
  fastify: 'Fastify + OpenAPI docs',
  express: 'Express + TypeScript',
  hono: 'Hono + OpenAPI',
  nestjs: 'NestJS',
  none: 'None (frontend-only project)',
};

const FRONTEND_PRESETS = {
  'react-vite': 'React + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui',
  nextjs: 'Next.js + TypeScript + Tailwind CSS v4 + shadcn/ui',
  remix: 'Remix + TypeScript + Tailwind CSS v4',
  'vue-vite': 'Vue 3 + Vite + TypeScript',
  none: 'None (backend-only project)',
};

const AUTH_PRESETS = {
  'better-auth': 'Better Auth (Phone OTP + Magic Link)',
  clerk: 'Clerk',
  nextauth: 'NextAuth.js',
  custom: 'Custom auth',
  none: 'None',
};

const DATABASE_PRESETS = {
  postgres: 'PostgreSQL',
  sqlite: 'SQLite',
  mysql: 'MySQL',
  mongodb: 'MongoDB',
  none: 'None',
};

// DESIGN_TOOL is both a state key (agents match strict equality on `label`)
// and a user-facing option (wizard shows `description`). Object form keeps
// them separate. Other *_PRESETS stay flat string because they're only
// documentation substituted into CLAUDE.md.
const DESIGN_PRESETS = {
  pencil:   { label: 'Pencil',   description: 'Pencil (.pen files)' },
  markdown: { label: 'Markdown', description: 'Markdown (design-system/MASTER.md + pages/)' },
  figma:    { label: 'Figma',    description: 'Figma (code-only handoff)' },
  none:     { label: 'None',     description: 'None' },
};

const HELP = `
demiurge — install a Claude Code multi-agent orchestrator template

Usage:
  npx demiurge [options]

Options:
  --project <name>            Project name (default: current directory name)
  --description <text>        One-line project description
  --backend <preset>          fastify | express | hono | nestjs | none (default: fastify)
  --frontend <preset>         react-vite | nextjs | remix | vue-vite | none (default: react-vite)
  --auth <preset>             better-auth | clerk | nextauth | custom | none (default: better-auth)
  --database <preset>         postgres | sqlite | mysql | mongodb | none (default: postgres)
  --design <preset>           pencil | markdown | figma | none (default: markdown)
  --force                     Overwrite existing files if they exist
  --dry-run                   Print what would be copied, do nothing
  --yes, -y                   Skip prompts, use defaults
  --help, -h                  Show this help

What it installs:
  .claude/agents/          5 specialist agents (pm, reviewer, designer, frontend, backend)
  .claude/hooks/           SessionStart, scope-check, SessionStop, protect-files, check-deps
  .claude/rules/           security, coding-style, agent-behavior
  .claude/skills/          orchestrator skills + one design skill matching --design
  .claude/workflows/       Declarative YAML pipeline definitions (default.yaml)
  design-system/           Markdown design artifacts (only with --design markdown)
  .claude/settings.json    Hook registrations
  docs/ARCHITECTURE.md     Skeleton for your architecture
  docs/DECISIONS.md        YAML decisions log starter
  docs/MEMORY_BANK.md      Persistent state (survives /compact)
  docs/WORKFLOW.md         How the orchestrator works
  docs/tasks/_TEMPLATE*    Task file templates
  scripts/run-agent.sh     Launch a specialist on a task
  scripts/convert.sh       Export agents to .agents/ and .codex/
  CLAUDE.md                Project root context
  package.json             Bun workspaces root (frontend + backend) + proxy scripts
  biome.json               Shared Biome config (lint + format)
  frontend/, backend/      Workspace stubs — specialists fill them in on first task

After install:
  1. bun install — wires workspaces, installs root devDeps (Biome)
  2. Review CLAUDE.md — verify the stack was written correctly
  3. Drop project materials into docs/intake/ (notes, screenshots, links)
  4. Run Claude:
       claude
       > use the pm agent to read docs/intake/ and generate a brief
  5. Then decompose:
       /decompose TASK-001
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
      case '--backend':
        args.backend = argv[++i];
        break;
      case '--frontend':
        args.frontend = argv[++i];
        break;
      case '--auth':
        args.auth = argv[++i];
        break;
      case '--database':
        args.database = argv[++i];
        break;
      case '--design':
        args.design = argv[++i];
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

async function prompt(rl, question, defaultValue) {
  const answer = await rl.question(
    `${question}${defaultValue ? ` (${defaultValue})` : ''}: `,
  );
  return answer.trim() || defaultValue || '';
}

// Interactive single-choice selector. Uses raw-mode stdin + keypress events.
// TTY-only: caller must ensure stdin is interactive before calling. In
// non-interactive environments (CI, pipes) users should pass --yes and/or
// explicit --backend/--frontend/... flags instead.
async function selectFromList(label, presets, defaultKey) {
  const keys = Object.keys(presets);
  if (keys.length === 0) {
    throw new Error(`selectFromList: no options for "${label}"`);
  }

  if (!input.isTTY || !output.isTTY) {
    throw new Error(
      `Cannot prompt for "${label}" in a non-interactive environment. ` +
        'Pass --yes to accept all defaults, or provide explicit flags ' +
        '(--package-manager, --backend, --frontend, --auth, --database, --design).',
    );
  }

  let selectedIndex = Math.max(0, keys.indexOf(defaultKey));
  const linesWritten = 1 + keys.length; // label line + one per item

  const render = (firstRender) => {
    if (!firstRender) {
      output.write(ANSI.up(linesWritten) + ANSI.clearBelow);
    }
    output.write(
      `${ANSI.bold}? ${label}${ANSI.reset} ${ANSI.dim}(use ↑↓ and enter)${ANSI.reset}\n`,
    );
    keys.forEach((key, i) => {
      const value = presets[key];
      let text;
      if (typeof value === 'string') {
        text = `${key} — ${value}`;
      } else if (value && typeof value === 'object' && 'description' in value) {
        text = `${key} — ${value.description}`;
      } else {
        text = key;
      }
      if (i === selectedIndex) {
        output.write(`${ANSI.cyan}❯ ${text}${ANSI.reset}\n`);
      } else {
        output.write(`  ${text}\n`);
      }
    });
  };

  return new Promise((resolveSelect) => {
    emitKeypressEvents(input);
    const wasRaw = Boolean(input.isRaw);
    input.setRawMode(true);
    output.write(ANSI.hideCursor);

    const cleanup = () => {
      input.removeListener('keypress', onKeypress);
      process.removeListener('SIGINT', onSigint);
      input.setRawMode(wasRaw);
      output.write(ANSI.showCursor);
      input.pause();
    };

    const onSigint = () => {
      cleanup();
      output.write('\n');
      process.exit(130);
    };

    const onKeypress = (_str, key) => {
      if (!key) return;
      if ((key.ctrl && key.name === 'c') || key.name === 'escape') {
        onSigint();
        return;
      }
      if (key.name === 'up' || key.name === 'k') {
        selectedIndex = (selectedIndex - 1 + keys.length) % keys.length;
        render(false);
        return;
      }
      if (key.name === 'down' || key.name === 'j') {
        selectedIndex = (selectedIndex + 1) % keys.length;
        render(false);
        return;
      }
      if (key.name === 'return') {
        cleanup();
        // Collapse the multi-line widget into a single summary line.
        output.write(ANSI.up(linesWritten) + ANSI.clearBelow);
        output.write(
          `${ANSI.cyan}✔${ANSI.reset} ${label}: ${ANSI.bold}${keys[selectedIndex]}${ANSI.reset}\n`,
        );
        resolveSelect(keys[selectedIndex]);
      }
    };

    process.once('SIGINT', onSigint);
    input.on('keypress', onKeypress);
    input.resume();
    render(true);
  });
}

function validateChoice(value, presets, name) {
  if (!value) return null;
  if (presets[value]) return value;
  console.error(
    `Invalid --${name} "${value}". Valid: ${Object.keys(presets).join(', ')}.`,
  );
  process.exit(2);
}

function findConflicts(targetDir, design) {
  return discoverPaths(PACKAGE_ROOT, design)
    .filter(({ dest }) => existsSync(join(targetDir, dest)))
    .map(({ dest }) => dest);
}

function copyTemplate(targetDir, dryRun, design) {
  const copied = [];
  const skipped = [];
  const resolved = discoverPaths(PACKAGE_ROOT, design);

  for (const { src, dest } of resolved) {
    const absSrc = join(PACKAGE_ROOT, src);
    const absDest = join(targetDir, dest);
    if (!existsSync(absSrc)) {
      skipped.push(`${src} (missing in package)`);
      continue;
    }
    if (dryRun) {
      copied.push(dest);
      continue;
    }
    mkdirSync(dirname(absDest), { recursive: true });
    cpSync(absSrc, absDest, { recursive: true, preserveTimestamps: true });
    copied.push(dest);
  }
  return { copied, skipped, resolved };
}

function applyTemplates(targetDir, vars, resolved) {
  for (const rel of discoverTemplatedFiles(resolved)) {
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

  console.log(`demiurge → ${targetDir}`);

  // Validate preset flags early
  validateChoice(args.backend, BACKEND_PRESETS, 'backend');
  validateChoice(args.frontend, FRONTEND_PRESETS, 'frontend');
  validateChoice(args.auth, AUTH_PRESETS, 'auth');
  validateChoice(args.database, DATABASE_PRESETS, 'database');
  validateChoice(args.design, DESIGN_PRESETS, 'design');

  // Collect project metadata. Package manager is hard-wired to "bun" — the
  // scaffold is a bun-workspaces monorepo and cannot be installed with any
  // other manager at the moment.
  let projectName = args.project;
  let projectDescription = args.description;
  const packageManager = 'bun';
  let backend = args.backend;
  let frontend = args.frontend;
  let auth = args.auth;
  let database = args.database;
  let design = args.design;

  if (!args.yes && !args.dryRun) {
    const needsPrompts =
      !projectName ||
      !projectDescription ||
      !backend ||
      !frontend ||
      !auth ||
      !database ||
      !design;
    if (needsPrompts && (!input.isTTY || !output.isTTY)) {
      console.error(
        'Error: stdin is not a TTY but interactive prompts are required.',
      );
      console.error(
        'Either pass --yes to accept all defaults, or provide explicit flags:',
      );
      console.error(
        '  --project, --description, --backend,',
      );
      console.error('  --frontend, --auth, --database, --design');
      process.exit(2);
    }

    // Phase 1: text prompts via readline. Closed before the raw-mode wizard
    // to give selectFromList exclusive access to stdin.
    const rl = createInterface({ input, output });
    try {
      if (!projectName) {
        projectName = await prompt(rl, 'Project name', basename(targetDir));
      }
      if (!projectDescription) {
        projectDescription = await prompt(
          rl,
          'Project description (one sentence)',
          'A software project',
        );
      }
    } finally {
      rl.close();
    }

    // Phase 2: preset selects via the arrow-key wizard. selectFromList will
    // throw a descriptive error if stdin is not a TTY here. Package manager
    // is intentionally not prompted — demiurge currently only supports bun.
    if (!backend) {
      backend = await selectFromList('Backend', BACKEND_PRESETS, 'fastify');
    }
    if (!frontend) {
      frontend = await selectFromList(
        'Frontend',
        FRONTEND_PRESETS,
        'react-vite',
      );
    }
    if (!auth) {
      auth = await selectFromList('Auth', AUTH_PRESETS, 'better-auth');
    }
    if (!database) {
      database = await selectFromList(
        'Database',
        DATABASE_PRESETS,
        'postgres',
      );
    }
    if (!design) {
      design = await selectFromList('Design tool', DESIGN_PRESETS, 'markdown');
    }
  }

  // Apply defaults for anything still unset (dry-run / --yes / non-interactive)
  projectName ||= basename(targetDir);
  projectDescription ||= 'A software project';
  backend ||= 'fastify';
  frontend ||= 'react-vite';
  auth ||= 'better-auth';
  database ||= 'postgres';
  design ||= 'markdown';

  // Conflict check (after `design` is known, so we check only the paths we'll actually copy)
  const conflicts = findConflicts(targetDir, design);
  if (conflicts.length > 0 && !args.force && !args.dryRun) {
    console.error('\nExisting files that would be overwritten:');
    for (const c of conflicts) console.error(`  ${c}`);
    console.error('\nPass --force to overwrite, or --dry-run to preview.');
    process.exit(1);
  }

  const pmCommands = PACKAGE_MANAGERS[packageManager];

  const templateVars = {
    PROJECT_NAME: projectName,
    PROJECT_DESCRIPTION: projectDescription,
    PACKAGE_MANAGER: packageManager,
    PACKAGE_MANAGER_RUN: pmCommands.run,
    PACKAGE_MANAGER_DLX: pmCommands.dlx,
    BACKEND_STACK: BACKEND_PRESETS[backend],
    FRONTEND_STACK: FRONTEND_PRESETS[frontend],
    AUTH_STACK: AUTH_PRESETS[auth],
    DATABASE: DATABASE_PRESETS[database],
    DESIGN_TOOL: DESIGN_PRESETS[design].label,
  };

  // Copy
  const { copied, skipped, resolved } = copyTemplate(targetDir, args.dryRun, design);

  if (args.dryRun) {
    console.log('\nDry run — would copy:');
    copied.forEach((c) => console.log(`  ${c}`));
    if (skipped.length) {
      console.log('\nSkipped:');
      skipped.forEach((s) => console.log(`  ${s}`));
    }
    console.log('\nTemplate variables that would be applied:');
    for (const [k, v] of Object.entries(templateVars)) {
      console.log(`  ${k} = ${v}`);
    }
    return;
  }

  // Placeholder substitution
  applyTemplates(targetDir, templateVars, resolved);

  // Success output
  copied.forEach((c) => console.log(`  ✓ ${c}`));
  if (skipped.length) {
    console.log('\nSkipped:');
    skipped.forEach((s) => console.log(`  - ${s}`));
  }

  console.log(`
Installed in ${targetDir}

Stack:
  Package manager: ${packageManager} (bun workspaces: frontend + backend)
  Backend:         ${BACKEND_PRESETS[backend]}
  Frontend:        ${FRONTEND_PRESETS[frontend]}
  Auth:            ${AUTH_PRESETS[auth]}
  Database:        ${DATABASE_PRESETS[database]}
  Design:          ${DESIGN_PRESETS[design].description}

Next steps:
  1. bun install
       # installs root devDeps (Biome) and wires the frontend/backend workspaces
  2. Review CLAUDE.md — verify the stack was written correctly
  3. Drop project materials into docs/intake/ (notes, screenshots, links)
  4. Run Claude:
       claude
       > use the pm agent to read docs/intake/ and generate a brief
  5. Then decompose:
       /decompose TASK-001
`);
}

main().catch((err) => {
  console.error('Install failed:', err.message || err);
  process.exit(1);
});
