// packages/core/src/executors/executor.ts
import type { AgentRole, ExecutionResult, Task } from '../types';

export interface AgentConfig {
  role: AgentRole;
  model: string;
  promptPath: string;
}

export interface ExecutorRunParams {
  agent: AgentConfig;
  task: Task;
  compiledPrompt: string;
  projectDir: string;
}

export interface Executor {
  run(params: ExecutorRunParams): Promise<ExecutionResult>;
  stop(pid: number): Promise<void>;
  isRunning(pid: number): boolean;
}
