// cli/src/commands/ui.ts
import { Command } from 'commander';
import { resolve, join, dirname } from 'node:path';
import { existsSync } from 'node:fs';

// Resolve backend server relative to this file (not cwd)
function findBackendServer(): string {
  let dir = dirname(new URL(import.meta.url).pathname);
  while (dir !== '/') {
    const candidate = join(dir, 'backend', 'src', 'server.ts');
    if (existsSync(candidate)) return candidate;
    dir = dirname(dir);
  }
  throw new Error('Cannot find backend server. Is demiurge installed correctly?');
}

export function createUiCommand(): Command {
  const cmd = new Command('ui')
    .description('Start the UI dashboard')
    .option('-p, --port <port>', 'Port number', '4400')
    .action(async (opts) => {
      const projectDir = resolve(process.cwd());
      const dbPath = join(projectDir, '.demiurge', 'data.db');

      if (!existsSync(dbPath)) {
        console.error('Error: No demiurge project found. Run "demiurge init" first.');
        process.exit(1);
      }

      const serverPath = findBackendServer();
      const { createApp } = await import(serverPath);
      const app = await createApp({ projectDir });
      const port = parseInt(opts.port, 10);

      await app.listen({ port, host: '0.0.0.0' });
      console.log(`Demiurge UI running at http://localhost:${port}`);
    });

  return cmd;
}
