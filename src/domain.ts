import type {
  CreatorProject,
  ProjectDraft,
  ProjectStatus,
  ProjectTemplate,
  Workspace,
} from './types';

export const STATUS_META: Record<ProjectStatus, { label: string; shortLabel: string; tone: string }> = {
  idea: { label: 'Ideas', shortLabel: 'Idea', tone: 'citrus' },
  planning: { label: 'Planning', shortLabel: 'Plan', tone: 'sky' },
  producing: { label: 'Producing', shortLabel: 'Make', tone: 'coral' },
  editing: { label: 'Editing', shortLabel: 'Edit', tone: 'violet' },
  scheduled: { label: 'Scheduled', shortLabel: 'Ready', tone: 'amber' },
  published: { label: 'Published', shortLabel: 'Live', tone: 'mint' },
};

export const BUILT_IN_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'template-standard',
    name: 'Standard project',
    description: 'A flexible start-to-finish checklist for most creative work.',
    checklist: ['Confirm the core idea', 'Write the outline', 'Create the first draft', 'Prepare assets', 'Edit and review', 'Finalize title and description', 'Schedule or publish', 'Record lessons for next time'],
    builtIn: true,
  },
  {
    id: 'template-short-form',
    name: 'Short-form piece',
    description: 'A compact workflow built around one clear hook and payoff.',
    checklist: ['Choose one takeaway', 'Draft the opening hook', 'Write the beat sheet', 'Capture or create assets', 'Edit for pace', 'Add captions', 'Review the first frame', 'Publish and review'],
    builtIn: true,
  },
  {
    id: 'template-long-form',
    name: 'Long-form production',
    description: 'Research, structure, production, and quality checks for deeper work.',
    checklist: ['Define the audience promise', 'Collect and verify sources', 'Build the structure', 'Draft the full script', 'Create the asset list', 'Produce the first cut', 'Complete fact and quality checks', 'Finalize packaging', 'Publish and document results'],
    builtIn: true,
  },
  {
    id: 'template-audio',
    name: 'Audio episode',
    description: 'Plan, record, edit, and package an audio-first project.',
    checklist: ['Define the episode angle', 'Prepare talking points', 'Test recording setup', 'Record', 'Edit audio', 'Write show notes', 'Create cover artwork', 'Run a final listen', 'Schedule or publish'],
    builtIn: true,
  },
  {
    id: 'template-newsletter',
    name: 'Written edition',
    description: 'A focused editorial workflow for articles and newsletters.',
    checklist: ['Choose the central idea', 'Gather references', 'Draft the opening', 'Write the full edition', 'Edit for clarity', 'Verify links and claims', 'Format the final version', 'Proofread', 'Schedule or publish'],
    builtIn: true,
  },
];

export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `cd-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyWorkspace(): Workspace {
  return {
    version: 1,
    projects: [],
    templates: BUILT_IN_TEMPLATES.map((template) => ({ ...template, checklist: [...template.checklist] })),
    settings: { theme: 'system' },
  };
}

export function todayIso(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createProject(draft: ProjectDraft, now = new Date()): CreatorProject {
  const timestamp = now.toISOString();
  return {
    id: createId(),
    ...draft,
    checklist: draft.checklist.map((item) => ({ ...item })),
    resources: draft.resources.map((resource) => ({ ...resource })),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function draftFromTemplate(template?: ProjectTemplate, status: ProjectStatus = 'idea'): ProjectDraft {
  return {
    title: '',
    contentType: '',
    status,
    priority: 'normal',
    targetDate: '',
    hook: '',
    objective: '',
    audience: '',
    notes: '',
    tags: [],
    checklist: (template?.checklist ?? []).map((label) => ({ id: createId(), label, done: false })),
    resources: [],
  };
}

export function projectToDraft(project: CreatorProject): ProjectDraft {
  return {
    title: project.title,
    contentType: project.contentType,
    status: project.status,
    priority: project.priority,
    targetDate: project.targetDate,
    hook: project.hook,
    objective: project.objective,
    audience: project.audience,
    notes: project.notes,
    tags: [...project.tags],
    checklist: project.checklist.map((item) => ({ ...item })),
    resources: project.resources.map((resource) => ({ ...resource })),
  };
}

export function formatDate(value: string, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }): string {
  if (value === '') return 'No date';
  const [year, month, day] = value.split('-').map(Number);
  if (year === undefined || month === undefined || day === undefined) return value;
  return new Intl.DateTimeFormat(undefined, options).format(new Date(year, month - 1, day));
}

export function isOverdue(project: CreatorProject, today = todayIso()): boolean {
  return project.targetDate !== '' && project.targetDate < today && project.status !== 'published';
}

export function checklistProgress(project: CreatorProject): number {
  if (project.checklist.length === 0) return 0;
  return Math.round((project.checklist.filter((item) => item.done).length / project.checklist.length) * 100);
}

export function getMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
}
