// cli/src/commands/intake.ts
import { Command } from 'commander';
import { readFileSync, existsSync } from 'node:fs';
import { basename } from 'node:path';
import { loadProject } from '../utils';

export function createIntakeCommand(): Command {
  const cmd = new Command('intake')
    .description('Upload documents and optionally trigger PM')
    .argument('<files...>', 'Files to upload')
    .option('--run-pm', 'Trigger PM agent after upload')
    .action((files: string[], opts) => {
      const ctx = loadProject();

      for (const filePath of files) {
        if (!existsSync(filePath)) {
          console.error(`File not found: ${filePath}`);
          continue;
        }
        const content = readFileSync(filePath, 'utf-8');
        const doc = ctx.documents.create({
          filename: basename(filePath),
          content,
          type: 'intake',
        });
        console.log(`Uploaded: ${doc.filename} (${doc.id})`);
      }

      if (opts.runPm) {
        console.log('Triggering PM agent...');
        const taskList = ctx.tasks.list({});
        let taskId: string;
        if (taskList.length === 0) {
          const task = ctx.tasks.create({
            title: 'Process intake documents',
            assigned_to: 'pm',
          });
          taskId = task.id;
        } else {
          taskId = taskList[0].id;
        }
        console.log(`Run: demiurge run pm --task ${taskId}`);
      }

      ctx.adapter.close();
    });

  return cmd;
}
