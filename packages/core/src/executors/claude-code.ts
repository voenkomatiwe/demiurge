// packages/core/src/executors/claude-code.ts
import { spawn } from 'node:child_process';
import type { Executor, ExecutorRunParams } from './executor';
import type { ExecutionResult } from '../types';

export class ClaudeCodeExecutor implements Executor {
  async run(params: ExecutorRunParams): Promise<ExecutionResult> {
    const { agent, compiledPrompt, projectDir } = params;

    return new Promise((resolve, reject) => {
      const child = spawn('claude', [
        '-p',
        '--model', agent.model,
        '--allowedTools', 'Read,Write,Edit,Grep,Glob,Bash',
      ], {
        cwd: projectDir,
        stdio: ['pipe', 'pipe', 'inherit'], // stderr → terminal (real-time progress)
      });

      // Pass prompt via stdin (too large for CLI argument)
      child.stdin.write(compiledPrompt);
      child.stdin.end();

      let stdout = '';

      child.stdout.on('data', (data: Buffer) => {
        const text = data.toString();
        stdout += text;
        process.stdout.write(text); // Stream to terminal in real-time
      });

      child.on('close', (code) => {
        resolve({
          sessionId: '',
          status: code === 0 ? 'completed' : 'failed',
          log: stdout,
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
