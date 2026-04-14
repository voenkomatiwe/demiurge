#!/usr/bin/env bun
// cli/src/index.ts
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { createTaskCommand } from './commands/task';
import { createRunCommand } from './commands/run';
import { createIntakeCommand } from './commands/intake';
import { createInitCommand } from './commands/init';
import { createUiCommand } from './commands/ui';
import { loadProject } from './utils';

const program = new Command()
  .name('demiurge')
  .description('Multi-agent AI orchestrator')
  .version('0.2.0');

program.addCommand(createInitCommand());
program.addCommand(createTaskCommand());
program.addCommand(createRunCommand());
program.addCommand(createIntakeCommand());
program.addCommand(createUiCommand());

// Memory subcommand
const memoryCmd = new Command('memory').description('Manage memory bank');
memoryCmd
  .command('get')
  .description('Get current memory bank')
  .action(() => {
    const ctx = loadProject();
    const content = ctx.memory.get();
    console.log(content ?? '(empty)');
    ctx.adapter.close();
  });
memoryCmd
  .command('set')
  .description('Set memory bank content (reads from stdin if argument is "-")')
  .argument('<content>', 'Content or "-" for stdin')
  .action((content) => {
    const ctx = loadProject();
    const text =
      content === '-' ? readFileSync('/dev/stdin', 'utf-8').trim() : content;
    ctx.memory.set(text);
    console.log('Memory bank updated.');
    ctx.adapter.close();
  });
program.addCommand(memoryCmd);

// Agents subcommand
const agentsCmd = new Command('agents').description('Manage agent sessions');
agentsCmd
  .command('sessions')
  .description('List agent sessions')
  .option('--status <status>', 'Filter by status')
  .action((opts) => {
    const ctx = loadProject();
    const sessions = ctx.agents.listSessions({ status: opts.status });
    for (const s of sessions) {
      console.log(`${s.id}\t${s.status}\t${s.agent}\t${s.task_id}`);
    }
    ctx.adapter.close();
  });
agentsCmd
  .command('stop')
  .description('Stop a running agent')
  .requiredOption('--session <id>', 'Session ID')
  .action((opts) => {
    const ctx = loadProject();
    const session = ctx.agents.getSession(opts.session);
    if (!session) {
      console.error('Session not found.');
      process.exit(1);
    }
    if (session.pid) {
      try {
        process.kill(session.pid, 'SIGTERM');
      } catch {
        // Process already exited
      }
    }
    ctx.agents.complete(opts.session, 'failed', 'Stopped by user');
    console.log(`Stopped session ${opts.session}`);
    ctx.adapter.close();
  });
program.addCommand(agentsCmd);

// Decision subcommand
const decisionCmd = new Command('decision').description('Manage decisions');
decisionCmd
  .command('add')
  .description('Add a decision')
  .requiredOption('--title <title>', 'Decision title')
  .requiredOption('--decision <text>', 'Decision text')
  .option('--reason <reason>', 'Reason')
  .option('--tags <tags>', 'Comma-separated tags')
  .action((opts) => {
    const ctx = loadProject();
    const tags = opts.tags
      ? opts.tags.split(',').map((t: string) => t.trim())
      : undefined;
    const d = ctx.decisions.create({
      title: opts.title,
      decision: opts.decision,
      reason: opts.reason,
      tags,
    });
    console.log(`Decision #${d.id}: ${d.title}`);
    ctx.adapter.close();
  });
decisionCmd
  .command('list')
  .description('List decisions')
  .option('--tags <tags>', 'Filter by comma-separated tags')
  .action((opts) => {
    const ctx = loadProject();
    const tags = opts.tags
      ? opts.tags.split(',').map((t: string) => t.trim())
      : undefined;
    const decisions = ctx.decisions.list({ tags });
    for (const d of decisions) {
      console.log(`#${d.id}\t${d.title}\t[${(d.tags ?? []).join(', ')}]`);
    }
    ctx.adapter.close();
  });
program.addCommand(decisionCmd);

program.parse();
