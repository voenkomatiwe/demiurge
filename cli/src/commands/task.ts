// cli/src/commands/task.ts
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { loadProject } from '../utils';

export function createTaskCommand(): Command {
  const cmd = new Command('task').description('Manage tasks');

  cmd
    .command('list')
    .description('List all tasks')
    .option('--status <status>', 'Filter by status')
    .option('--assigned-to <agent>', 'Filter by agent')
    .option('--parent <id>', 'Filter by parent task')
    .action((opts) => {
      const ctx = loadProject();
      const tasks = ctx.tasks.list({
        status: opts.status,
        assigned_to: opts.assignedTo,
        parent_id: opts.parent,
      });
      if (tasks.length === 0) {
        console.log('No tasks found.');
        ctx.adapter.close();
        return;
      }
      for (const t of tasks) {
        console.log(
          `${t.id}\t${t.status}\t${t.assigned_to ?? '-'}\t${t.title}`,
        );
      }
      ctx.adapter.close();
    });

  cmd
    .command('get <id>')
    .description('Get task details')
    .action((id) => {
      const ctx = loadProject();
      const task = ctx.tasks.get(id);
      if (!task) {
        console.error(`Task ${id} not found.`);
        process.exit(1);
      }
      console.log(JSON.stringify(task, null, 2));
      ctx.adapter.close();
    });

  cmd
    .command('create')
    .description('Create a new task')
    .requiredOption('--title <title>', 'Task title')
    .option('--assigned-to <agent>', 'Assign to agent')
    .option('--goal <goal>', 'Task goal')
    .option('--parent <id>', 'Parent task ID')
    .option('--workspace <dirs...>', 'Working directories')
    .action((opts) => {
      const ctx = loadProject();
      let task;
      if (opts.parent) {
        task = ctx.tasks.createSubtask(opts.parent, {
          title: opts.title,
          assigned_to: opts.assignedTo,
          goal: opts.goal,
          workspace: opts.workspace,
        });
      } else {
        task = ctx.tasks.create({
          title: opts.title,
          assigned_to: opts.assignedTo,
          goal: opts.goal,
          workspace: opts.workspace,
        });
      }
      console.log(`Created: ${task.id}`);
      ctx.adapter.close();
    });

  cmd
    .command('update <id>')
    .description('Update a task')
    .option('--status <status>', 'New status')
    .option('--goal <goal>', 'Set goal (use "-" to read from stdin)')
    .option('--not-doing <text>', 'Set scope exclusions')
    .option('--plan <plan>', 'Set plan (use "-" to read from stdin)')
    .option('--progress <progress>', 'Set progress (use "-" to read from stdin)')
    .option('--review <review>', 'Set review (use "-" to read from stdin)')
    .option('--revisions <revisions>', 'Set revisions')
    .option('--assigned-to <agent>', 'Assign to agent')
    .option('--workspace <dirs...>', 'Working directories')
    .action((id, opts) => {
      const ctx = loadProject();
      const fields: Record<string, unknown> = {};

      // Handle stdin for long-form fields
      for (const field of ['goal', 'plan', 'progress', 'review'] as const) {
        if (opts[field] === '-') {
          fields[field] = readFileSync('/dev/stdin', 'utf-8').trim();
        } else if (opts[field]) {
          fields[field] = opts[field];
        }
      }

      if (opts.notDoing) fields.not_doing = opts.notDoing;
      if (opts.revisions) fields.revisions = opts.revisions;
      if (opts.assignedTo) fields.assigned_to = opts.assignedTo;
      if (opts.workspace) fields.workspace = opts.workspace;

      if (opts.status) {
        ctx.tasks.updateStatus(id, opts.status);
      }

      if (Object.keys(fields).length > 0) {
        ctx.tasks.update(id, fields);
      }

      console.log(`Updated: ${id}`);
      ctx.adapter.close();
    });

  cmd
    .command('delete <id>')
    .description('Delete a task')
    .action((id) => {
      const ctx = loadProject();
      ctx.tasks.delete(id);
      console.log(`Deleted: ${id}`);
      ctx.adapter.close();
    });

  return cmd;
}
