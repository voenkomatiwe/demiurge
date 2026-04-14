// cli/src/commands/run.ts
import { Command } from 'commander';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadProject } from '../utils';
import {
  compilePrompt,
  ClaudeCodeExecutor,
  CodexExecutor,
  type Executor,
} from '@demiurge/core';

export function createRunCommand(): Command {
  const cmd = new Command('run')
    .description('Run an agent on a task')
    .argument(
      '<agent>',
      'Agent role (pm, frontend, backend, designer, reviewer)',
    )
    .requiredOption('--task <id>', 'Task ID to work on')
    .action(async (agentRole, opts) => {
      const ctx = loadProject();

      // Check for orphaned sessions (PID exists but process is dead)
      const runningSessions = ctx.agents.listSessions({ status: 'running' });
      for (const s of runningSessions) {
        if (s.pid) {
          try {
            process.kill(s.pid, 0);
          } catch {
            ctx.agents.complete(
              s.id,
              'failed',
              'Orphaned session — process no longer running',
            );
          }
        }
      }

      const task = ctx.tasks.get(opts.task);
      if (!task) {
        console.error(`Task ${opts.task} not found.`);
        process.exit(1);
      }

      // Read agent prompt file
      const agentPromptPath = join(
        ctx.projectDir,
        'agents',
        agentRole,
        'agent.md',
      );
      if (!existsSync(agentPromptPath)) {
        console.error(`Agent prompt not found: ${agentPromptPath}`);
        process.exit(1);
      }
      const agentPrompt = readFileSync(agentPromptPath, 'utf-8');

      // Get memory
      const memoryBank = ctx.memory.get();

      // Compile prompt
      const compiledPrompt = compilePrompt({
        agentPrompt,
        task,
        memoryBank,
        projectDir: ctx.projectDir,
        mode: 'local',
      });

      // Select executor
      const model =
        ctx.config.agents[agentRole as keyof typeof ctx.config.agents]?.model ??
        ctx.config.model;
      let executor: Executor;
      if (ctx.config.executor === 'codex') {
        executor = new CodexExecutor();
      } else {
        executor = new ClaudeCodeExecutor();
      }

      // Create session
      const session = ctx.agents.createSession(
        task.id,
        agentRole,
        ctx.config.executor,
      );
      console.log(
        `Started session ${session.id} for ${agentRole} on ${task.id}`,
      );

      // Run
      const result = await executor.run({
        agent: { role: agentRole, model, promptPath: agentPromptPath },
        task,
        compiledPrompt,
        projectDir: ctx.projectDir,
      });

      // Update session
      ctx.agents.complete(session.id, result.status, result.log);
      console.log(`Session ${session.id} ${result.status}`);

      ctx.adapter.close();
    });

  return cmd;
}
