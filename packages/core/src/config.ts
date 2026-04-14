// packages/core/src/config.ts
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { DemiurgeConfig } from './types';

const DEFAULT_CONFIG: DemiurgeConfig = {
  executor: 'claude-code',
  model: 'opus',
  agents: {
    pm: { model: 'opus' },
    reviewer: { model: 'opus' },
    designer: { model: 'sonnet' },
    frontend: { model: 'sonnet' },
    backend: { model: 'sonnet' },
  },
};

export function loadConfig(projectDir: string): DemiurgeConfig {
  const configPath = join(projectDir, 'demiurge.config.json');
  if (!existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }
  const raw = readFileSync(configPath, 'utf-8');
  return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
}

export function writeConfig(projectDir: string, config: DemiurgeConfig): void {
  const configPath = join(projectDir, 'demiurge.config.json');
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
}

export type ExecutionMode = 'local' | 'github';

export function getExecutionMode(config: DemiurgeConfig): ExecutionMode {
  if (config.executor === 'github-actions') return 'github';
  return 'local';
}
