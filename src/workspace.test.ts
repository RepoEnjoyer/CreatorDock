import { describe, expect, it } from 'vitest';
import { createEmptyWorkspace, draftFromTemplate } from './domain';
import type { Workspace } from './types';
import { workspaceReducer } from './workspace';

function createOne(workspace: Workspace = createEmptyWorkspace()) {
  return workspaceReducer(workspace, {
    type: 'project/create',
    draft: {
      ...draftFromTemplate(),
      title: 'Practical creator workflow',
      checklist: [{ id: 'task-one', label: 'Draft', done: false }],
    },
  });
}

describe('workspace reducer', () => {
  it('creates, updates, moves, and toggles projects immutably', () => {
    const original = createEmptyWorkspace();
    const created = createOne(original);
    const project = created.projects[0]!;
    const moved = workspaceReducer(created, { type: 'project/move', id: project.id, status: 'editing' });
    const toggled = workspaceReducer(moved, { type: 'project/toggle-task', projectId: project.id, taskId: 'task-one' });
    const updated = workspaceReducer(toggled, {
      type: 'project/update',
      id: project.id,
      draft: { ...draftFromTemplate(), title: 'Revised workflow', status: 'scheduled' },
    });

    expect(original.projects).toEqual([]);
    expect(moved.projects[0]?.status).toBe('editing');
    expect(toggled.projects[0]?.checklist[0]?.done).toBe(true);
    expect(updated.projects[0]?.title).toBe('Revised workflow');
    expect(updated.projects[0]?.status).toBe('scheduled');
  });

  it('duplicates into Ideas with fresh checklist and resource IDs', () => {
    const created = createOne();
    const original = created.projects[0]!;
    original.resources.push({ id: 'resource-one', label: 'Source', url: 'https://example.com' });
    const duplicated = workspaceReducer(created, { type: 'project/duplicate', id: original.id });
    const copy = duplicated.projects[0]!;

    expect(duplicated.projects).toHaveLength(2);
    expect(copy.title).toBe(`${original.title} copy`);
    expect(copy.status).toBe('idea');
    expect(copy.id).not.toBe(original.id);
    expect(copy.checklist[0]?.id).not.toBe(original.checklist[0]?.id);
    expect(copy.checklist[0]?.done).toBe(false);
    expect(copy.resources[0]?.id).not.toBe(original.resources[0]?.id);
  });

  it('deletes projects and ignores unknown IDs', () => {
    const created = createOne();
    const unchanged = workspaceReducer(created, { type: 'project/duplicate', id: 'missing' });
    const deleted = workspaceReducer(created, { type: 'project/delete', id: created.projects[0]!.id });

    expect(unchanged).toBe(created);
    expect(deleted.projects).toEqual([]);
  });

  it('creates, updates, and deletes custom templates without changing built-ins', () => {
    const workspace = createEmptyWorkspace();
    const created = workspaceReducer(workspace, {
      type: 'template/create',
      template: { name: 'Fast review', description: 'A focused check.', checklist: ['Check title'] },
    });
    const custom = created.templates.find((template) => !template.builtIn)!;
    const updated = workspaceReducer(created, {
      type: 'template/update',
      id: custom.id,
      template: { name: 'Final review', description: 'A final focused check.', checklist: ['Check title', 'Check links'] },
    });
    const attemptedBuiltInChange = workspaceReducer(updated, {
      type: 'template/update',
      id: 'template-standard',
      template: { name: 'Changed', description: '', checklist: ['Changed'] },
    });
    const deleted = workspaceReducer(attemptedBuiltInChange, { type: 'template/delete', id: custom.id });

    expect(updated.templates.find((template) => template.id === custom.id)?.name).toBe('Final review');
    expect(attemptedBuiltInChange.templates.find((template) => template.id === 'template-standard')?.name).toBe('Standard project');
    expect(deleted.templates.every((template) => template.builtIn)).toBe(true);
  });

  it('changes appearance, replaces a workspace, and clears only projects', () => {
    const withProject = createOne();
    const withCustomTemplate = workspaceReducer(withProject, {
      type: 'template/create',
      template: { name: 'Personal process', description: '', checklist: ['Start'] },
    });
    const dark = workspaceReducer(withCustomTemplate, { type: 'settings/theme', theme: 'dark' });
    const cleared = workspaceReducer(dark, { type: 'workspace/clear-projects' });
    const replacement = createEmptyWorkspace();

    expect(dark.settings.theme).toBe('dark');
    expect(cleared.projects).toEqual([]);
    expect(cleared.templates.some((template) => !template.builtIn)).toBe(true);
    expect(workspaceReducer(cleared, { type: 'workspace/replace', workspace: replacement })).toBe(replacement);
  });
});
