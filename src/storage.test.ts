import { describe, expect, it } from 'vitest';
import { createEmptyWorkspace, createProject, draftFromTemplate } from './domain';
import {
  BACKUP_FORMAT,
  MAX_BACKUP_BYTES,
  STORAGE_KEY,
  isSafeResourceUrl,
  loadWorkspace,
  parseBackup,
  saveWorkspace,
  serializeBackup,
  validateWorkspace,
  type StorageLike,
} from './storage';

function workspaceWithProject() {
  const workspace = createEmptyWorkspace();
  workspace.projects.push(createProject({
    ...draftFromTemplate(),
    title: 'Creator systems review',
    contentType: 'Article',
    tags: ['systems', 'review'],
    resources: [{ id: 'reference', label: 'Reference', url: 'https://example.com/source' }],
  }, new Date('2026-04-02T10:00:00.000Z')));
  return workspace;
}

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe('backup validation', () => {
  it('round-trips a portable backup', () => {
    const workspace = workspaceWithProject();
    const content = serializeBackup(workspace, new Date('2026-04-02T11:00:00.000Z'));
    const parsedEnvelope = JSON.parse(content) as { format: string };

    expect(parsedEnvelope.format).toBe(BACKUP_FORMAT);
    expect(parseBackup(content)).toEqual(workspace);
  });

  it('also accepts the raw workspace format used in browser storage', () => {
    const workspace = workspaceWithProject();
    expect(parseBackup(JSON.stringify(workspace))).toEqual(workspace);
  });

  it('rejects malformed, oversized, and unsupported backups', () => {
    expect(() => parseBackup('{oops')).toThrow('valid JSON');
    expect(() => parseBackup('x'.repeat(MAX_BACKUP_BYTES + 1))).toThrow('2 MiB');
    expect(() => parseBackup(JSON.stringify({ version: 2 }))).toThrow('unsupported');
  });

  it('rejects duplicate project IDs', () => {
    const workspace = workspaceWithProject();
    workspace.projects.push({ ...workspace.projects[0]! });
    expect(() => validateWorkspace(workspace)).toThrow('unique');
  });

  it('rejects impossible dates and loose boolean values', () => {
    const workspace = workspaceWithProject();
    workspace.projects[0]!.targetDate = '2026-02-31';
    expect(() => validateWorkspace(workspace)).toThrow('real calendar date');

    const invalidBoolean = JSON.parse(JSON.stringify(workspaceWithProject())) as unknown as {
      projects: Array<{ checklist: Array<{ id: string; label: string; done: unknown }> }>;
    };
    invalidBoolean.projects[0]!.checklist = [{ id: 'task', label: 'Task', done: 'false' }];
    expect(() => validateWorkspace(invalidBoolean)).toThrow('true or false');
  });

  it('rejects unsafe resource protocols', () => {
    expect(isSafeResourceUrl('https://example.com')).toBe(true);
    expect(isSafeResourceUrl('http://localhost:8080/notes')).toBe(true);
    expect(isSafeResourceUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeResourceUrl('data:text/html,hello')).toBe(false);
    expect(isSafeResourceUrl('not a URL')).toBe(false);

    const workspace = workspaceWithProject();
    workspace.projects[0]!.resources[0]!.url = ['file:', '///example'].join('');
    expect(() => validateWorkspace(workspace)).toThrow('http or https');
  });

  it('restores canonical built-in templates while retaining custom templates', () => {
    const workspace = workspaceWithProject();
    workspace.templates = [{
      id: 'custom-review',
      name: 'Review pass',
      description: 'A custom final review.',
      checklist: ['Read aloud'],
      builtIn: false,
    }];

    const parsed = validateWorkspace(workspace);
    expect(parsed.templates.some((template) => template.id === 'template-standard')).toBe(true);
    expect(parsed.templates.some((template) => template.id === 'custom-review')).toBe(true);
  });
});

describe('browser persistence', () => {
  it('saves and loads from storage', () => {
    const storage = new MemoryStorage();
    const workspace = workspaceWithProject();

    expect(saveWorkspace(workspace, storage)).toBe(true);
    expect(storage.values.has(STORAGE_KEY)).toBe(true);
    expect(loadWorkspace(storage).workspace).toEqual(workspace);
  });

  it('fails safely when browser storage throws', () => {
    const broken: StorageLike = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
    };

    expect(loadWorkspace(broken).warning).toContain('unavailable');
    expect(saveWorkspace(createEmptyWorkspace(), broken)).toBe(false);
  });

  it('does not load corrupted saved data', () => {
    const storage = new MemoryStorage();
    storage.values.set(STORAGE_KEY, '{bad');
    const result = loadWorkspace(storage);

    expect(result.workspace.projects).toEqual([]);
    expect(result.warning).toContain('invalid');
  });
});
