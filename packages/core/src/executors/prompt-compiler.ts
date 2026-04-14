// packages/core/src/executors/prompt-compiler.ts
import type { Task } from '../types';

interface CompileParams {
  agentPrompt: string;
  task: Task;
  memoryBank: string | null;
  projectDir: string;
  mode?: 'local' | 'github';  // defaults to 'local'
}

export function getInteractionInstructions(mode: 'local' | 'github', taskId: string): string {
  if (mode === 'github') {
    return [
      '\n---\n## How to Execute Task Interactions\n',
      'You are running inside a GitHub Action. Use `gh` CLI to interact with the task system.\n',
      '```bash',
      '# Update status (add/remove labels)',
      `gh issue edit ${taskId} --add-label "status:in-progress"`,
      '',
      '# Post progress update',
      `gh issue comment ${taskId} --body "**Progress:**\\nYour progress notes here..."`,
      '',
      '# Post your plan',
      `gh issue comment ${taskId} --body "**Plan:**\\nYour plan here..."`,
      '',
      '# When done, change status label',
      `gh issue edit ${taskId} --remove-label "status:in-progress" --add-label "status:review"`,
      '',
      '# Add a decision',
      'gh issue create --title "Decision: ..." --body "..." --label "decision"',
      '```',
    ].join('\n');
  }

  // Default: local CLI mode
  return [
    '\n---\n## How to Execute Task Interactions\n',
    'Use these commands (via Bash tool) to update your task.\n',
    '```bash',
    '# Update your status',
    `demiurge task update ${taskId} --status in-progress`,
    '',
    '# Save your plan',
    `demiurge task update ${taskId} --plan - <<'EOF'`,
    'Your plan here...',
    'EOF',
    '',
    '# Update progress',
    `demiurge task update ${taskId} --progress - <<'EOF'`,
    'Your progress notes...',
    'EOF',
    '',
    '# When done, set status to review',
    `demiurge task update ${taskId} --status review`,
    '',
    '# Read/write memory bank',
    'demiurge memory get',
    'demiurge memory set "your content"',
    '',
    '# Record a decision',
    'demiurge decision add --title "..." --decision "..." --tags tag1,tag2',
    '```',
  ].join('\n');
}

export function compilePrompt(params: CompileParams): string {
  const { agentPrompt, task, memoryBank, projectDir } = params;
  const sections: string[] = [];

  // Base agent prompt
  sections.push(agentPrompt);

  // Task context
  sections.push("\n---\n## Your Task\n");
  sections.push(`**ID:** ${task.id}`);
  sections.push(`**Title:** ${task.title}`);

  if (task.goal) {
    sections.push(`\n### Goal\n${task.goal}`);
  }
  if (task.not_doing) {
    sections.push(`\n### Not Doing (out of scope)\n${task.not_doing}`);
  }
  if (task.design_ref) {
    sections.push(`\n### Design Reference\n${task.design_ref}`);
  }

  // Workspace
  if (task.workspace && task.workspace.length > 0) {
    sections.push("\n### Your Workspace");
    sections.push("You may ONLY read and write files in these directories:");
    for (const dir of task.workspace) {
      sections.push(`- \`${dir}\``);
    }
  }

  // Dependencies
  if (task.dependencies && task.dependencies.length > 0) {
    sections.push(`\n### Dependencies\nThis task depends on: ${task.dependencies.join(', ')}`);
  }

  // Existing plan/progress (if resuming)
  if (task.plan) {
    sections.push(`\n### Current Plan\n${task.plan}`);
  }
  if (task.progress) {
    sections.push(`\n### Current Progress\n${task.progress}`);
  }
  if (task.revisions) {
    sections.push(`\n### Revision Feedback\n${task.revisions}`);
  }

  // Memory bank
  if (memoryBank) {
    sections.push(`\n---\n## Memory Bank (project state)\n${memoryBank}`);
  }

  // Mode-specific interaction instructions
  const mode = params.mode ?? 'local';
  sections.push(getInteractionInstructions(mode, task.id));

  return sections.join('\n');
}
