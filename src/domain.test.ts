import { describe, expect, it } from 'vitest';
import {
  BUILT_IN_TEMPLATES,
  checklistProgress,
  createEmptyWorkspace,
  createProject,
  draftFromTemplate,
  formatDate,
  getMonthGrid,
  isOverdue,
  projectToDraft,
  todayIso,
} from './domain';

describe('project domain', () => {
  it('starts with an empty workspace and independent built-in templates', () => {
    const first = createEmptyWorkspace();
    const second = createEmptyWorkspace();

    expect(first.projects).toEqual([]);
    expect(first.templates).toHaveLength(BUILT_IN_TEMPLATES.length);
    first.templates[0]?.checklist.push('Local mutation');
    expect(second.templates[0]?.checklist).not.toContain('Local mutation');
  });

  it('turns a template into a fresh project draft', () => {
    const template = BUILT_IN_TEMPLATES[0];
    const draft = draftFromTemplate(template, 'planning');

    expect(draft.status).toBe('planning');
    expect(draft.title).toBe('');
    expect(draft.checklist.map((item) => item.label)).toEqual(template?.checklist);
    expect(new Set(draft.checklist.map((item) => item.id)).size).toBe(draft.checklist.length);
    expect(draft.checklist.every((item) => !item.done)).toBe(true);
  });

  it('creates a dated project and safely converts it back to a draft', () => {
    const now = new Date('2026-05-10T14:30:00.000Z');
    const draft = { ...draftFromTemplate(), title: 'Launch field guide', tags: ['guide'] };
    const project = createProject(draft, now);
    const copy = projectToDraft(project);

    expect(project.createdAt).toBe(now.toISOString());
    expect(project.updatedAt).toBe(now.toISOString());
    expect(copy).toEqual(draft);
    copy.tags.push('changed');
    expect(project.tags).toEqual(['guide']);
  });

  it('computes checklist progress and overdue state', () => {
    const project = createProject({
      ...draftFromTemplate(),
      title: 'Episode outline',
      targetDate: '2026-05-09',
      checklist: [
        { id: 'one', label: 'Outline', done: true },
        { id: 'two', label: 'Review', done: false },
      ],
    });

    expect(checklistProgress(project)).toBe(50);
    expect(isOverdue(project, '2026-05-10')).toBe(true);
    expect(isOverdue({ ...project, status: 'published' }, '2026-05-10')).toBe(false);
  });

  it('builds a stable six-week calendar grid', () => {
    const grid = getMonthGrid(2026, 4);

    expect(grid).toHaveLength(42);
    expect(grid[0]?.getDay()).toBe(0);
    expect(grid[41]?.getDay()).toBe(6);
    expect(grid.some((date) => date.getMonth() === 4 && date.getDate() === 31)).toBe(true);
  });

  it('formats local ISO dates without timezone drift', () => {
    expect(todayIso(new Date(2026, 0, 7))).toBe('2026-01-07');
    expect(formatDate('')).toBe('No date');
    expect(formatDate('2026-01-07', { year: 'numeric', month: '2-digit', day: '2-digit' })).not.toBe('2026-01-06');
  });
});
