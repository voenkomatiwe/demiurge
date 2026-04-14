// packages/core/src/executors/codex.ts
import { spawn } from 'node:child_process';
import type { Executor, ExecutorRunParams } from './executor';
import type { ExecutionResult } from '../types';

export class CodexExecutor implements Executor {
  async run(params: ExecutorRunParams): Promise<ExecutionResult> {
    const { agent, compiledPrompt, projectDir } = params;

    return new Promise((resolve, reject) => {
      const child = spawn('codex', [
        '--model', agent.model,
        '--approval-mode', 'full-auto',
      ], {
        cwd: projectDir,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Pass prompt via stdin (too large for CLI argument)
      child.stdin.write(compiledPrompt);
      child.stdin.end();

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data: Buffer) => { stdout += data.toString(); });
      child.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });

      child.on('close', (code) => {
        resolve({
          sessionId: '',
          status: code === 0 ? 'completed' : 'failed',
          log: stdout || stderr,
        });
      });

      child.on('error', (err) => {
        reject(err);
      });
    });
  }

  async stop(pid: number): Promise<void> {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      // Process already exited
    }
  }

  isRunning(pid: number): boolean {
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  }
}
