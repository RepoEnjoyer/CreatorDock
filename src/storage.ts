import { BUILT_IN_TEMPLATES, createEmptyWorkspace } from './domain';
import {
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  THEMES,
  type ChecklistItem,
  type CreatorProject,
  type ProjectPriority,
  type ProjectStatus,
  type ProjectTemplate,
  type ResourceLink,
  type Theme,
  type Workspace,
} from './types';

export const STORAGE_KEY = 'creatordock.workspace.v1';
export const BACKUP_FORMAT = 'creatordock-backup/v1';
export const MAX_BACKUP_BYTES = 2 * 1024 * 1024;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface LoadResult {
  workspace: Workspace;
  warning?: string;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown, field: string, maximum: number, allowEmpty = true): string {
  if (typeof value !== 'string' || value.length > maximum || (!allowEmpty && value.trim() === '')) {
    throw new Error(`${field} must be ${allowEmpty ? 'a' : 'a non-empty'} string under ${maximum} characters.`);
  }
  return value;
}

function stringArray(value: unknown, field: string, maximumItems: number, maximumLength: number): string[] {
  if (!Array.isArray(value) || value.length > maximumItems) throw new Error(`${field} is too large or invalid.`);
  return value.map((item, index) => stringValue(item, `${field}[${index}]`, maximumLength, false));
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) throw new Error(`${field} is invalid.`);
  return value as T;
}

function booleanValue(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`${field} must be true or false.`);
  return value;
}

function isoDate(value: unknown, field: string): string {
  const date = stringValue(value, field, 10);
  if (date !== '' && !/^\d{4}-\d{2}-\d{2}$/u.test(date)) throw new Error(`${field} must use YYYY-MM-DD.`);
  if (date !== '') {
    const [year, month, day] = date.split('-').map(Number);
    const parsed = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 0));
    if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() + 1 !== month || parsed.getUTCDate() !== day) {
      throw new Error(`${field} must be a real calendar date.`);
    }
  }
  return date;
}

function isoTimestamp(value: unknown, field: string): string {
  const timestamp = stringValue(value, field, 40, false);
  if (Number.isNaN(Date.parse(timestamp))) throw new Error(`${field} must be a valid timestamp.`);
  return timestamp;
}

function validateChecklist(value: unknown): ChecklistItem[] {
  if (!Array.isArray(value) || value.length > 100) throw new Error('Project checklist is too large or invalid.');
  const checklist = value.map((item, index) => {
    if (!isRecord(item)) throw new Error(`Checklist item ${index + 1} is invalid.`);
    return {
      id: stringValue(item.id, `checklist[${index}].id`, 100, false),
      label: stringValue(item.label, `checklist[${index}].label`, 240, false),
      done: booleanValue(item.done, `checklist[${index}].done`),
    };
  });
  if (new Set(checklist.map((item) => item.id)).size !== checklist.length) {
    throw new Error('Checklist item IDs must be unique within a project.');
  }
  return checklist;
}

export function isSafeResourceUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function validateResources(value: unknown): ResourceLink[] {
  if (!Array.isArray(value) || value.length > 50) throw new Error('Project resources are too large or invalid.');
  const resources = value.map((item, index) => {
    if (!isRecord(item)) throw new Error(`Resource ${index + 1} is invalid.`);
    const url = stringValue(item.url, `resources[${index}].url`, 2_000, false);
    if (!isSafeResourceUrl(url)) throw new Error(`Resource ${index + 1} must use an http or https URL.`);
    return {
      id: stringValue(item.id, `resources[${index}].id`, 100, false),
      label: stringValue(item.label, `resources[${index}].label`, 160, false),
      url,
    };
  });
  if (new Set(resources.map((resource) => resource.id)).size !== resources.length) {
    throw new Error('Resource IDs must be unique within a project.');
  }
  return resources;
}

function validateProject(value: unknown, index: number): CreatorProject {
  if (!isRecord(value)) throw new Error(`Project ${index + 1} is invalid.`);
  return {
    id: stringValue(value.id, `projects[${index}].id`, 100, false),
    title: stringValue(value.title, `projects[${index}].title`, 120, false),
    contentType: stringValue(value.contentType, `projects[${index}].contentType`, 80),
    status: enumValue<ProjectStatus>(value.status, PROJECT_STATUSES, `projects[${index}].status`),
    priority: enumValue<ProjectPriority>(value.priority, PROJECT_PRIORITIES, `projects[${index}].priority`),
    targetDate: isoDate(value.targetDate, `projects[${index}].targetDate`),
    hook: stringValue(value.hook, `projects[${index}].hook`, 500),
    objective: stringValue(value.objective, `projects[${index}].objective`, 500),
    audience: stringValue(value.audience, `projects[${index}].audience`, 240),
    notes: stringValue(value.notes, `projects[${index}].notes`, 8_000),
    tags: stringArray(value.tags, `projects[${index}].tags`, 12, 40),
    checklist: validateChecklist(value.checklist),
    resources: validateResources(value.resources),
    createdAt: isoTimestamp(value.createdAt, `projects[${index}].createdAt`),
    updatedAt: isoTimestamp(value.updatedAt, `projects[${index}].updatedAt`),
  };
}

function validateTemplate(value: unknown, index: number): ProjectTemplate {
  if (!isRecord(value)) throw new Error(`Template ${index + 1} is invalid.`);
  return {
    id: stringValue(value.id, `templates[${index}].id`, 100, false),
    name: stringValue(value.name, `templates[${index}].name`, 100, false),
    description: stringValue(value.description, `templates[${index}].description`, 300),
    checklist: stringArray(value.checklist, `templates[${index}].checklist`, 100, 240),
    builtIn: booleanValue(value.builtIn, `templates[${index}].builtIn`),
  };
}

function mergeBuiltInTemplates(templates: ProjectTemplate[]): ProjectTemplate[] {
  const custom = templates.filter((template) => !template.builtIn);
  return [
    ...BUILT_IN_TEMPLATES.map((template) => ({ ...template, checklist: [...template.checklist] })),
    ...custom,
  ];
}

export function validateWorkspace(value: unknown): Workspace {
  if (!isRecord(value) || value.version !== 1) throw new Error('This backup uses an unsupported CreatorDock version.');
  if (!Array.isArray(value.projects) || value.projects.length > 5_000) throw new Error('Project list is too large or invalid.');
  if (!Array.isArray(value.templates) || value.templates.length > 200) throw new Error('Template list is too large or invalid.');
  if (!isRecord(value.settings)) throw new Error('Workspace settings are invalid.');

  const projects = value.projects.map(validateProject);
  const projectIds = new Set(projects.map((project) => project.id));
  if (projectIds.size !== projects.length) throw new Error('Project IDs must be unique.');

  const templates = value.templates.map(validateTemplate);
  const customIds = templates.filter((template) => !template.builtIn).map((template) => template.id);
  if (new Set(customIds).size !== customIds.length) throw new Error('Custom template IDs must be unique.');

  return {
    version: 1,
    projects,
    templates: mergeBuiltInTemplates(templates),
    settings: { theme: enumValue<Theme>(value.settings.theme, THEMES, 'settings.theme') },
  };
}

export function serializeWorkspace(workspace: Workspace): string {
  return JSON.stringify(workspace);
}

export function serializeBackup(workspace: Workspace, now = new Date()): string {
  return `${JSON.stringify({ format: BACKUP_FORMAT, exportedAt: now.toISOString(), workspace }, null, 2)}\n`;
}

export function parseBackup(content: string): Workspace {
  if (new TextEncoder().encode(content).byteLength > MAX_BACKUP_BYTES) {
    throw new Error('Backup exceeds the 2 MiB import limit.');
  }
  let value: unknown;
  try {
    value = JSON.parse(content) as unknown;
  } catch {
    throw new Error('Backup is not valid JSON.');
  }
  if (isRecord(value) && value.format === BACKUP_FORMAT) return validateWorkspace(value.workspace);
  return validateWorkspace(value);
}

export function loadWorkspace(storage?: StorageLike): LoadResult {
  const fallback = createEmptyWorkspace();
  if (storage === undefined) return { workspace: fallback };
  let content: string | null;
  try {
    content = storage.getItem(STORAGE_KEY);
  } catch {
    return { workspace: fallback, warning: 'Browser storage is unavailable. Changes may not persist.' };
  }
  if (content === null) return { workspace: fallback };
  try {
    return { workspace: parseBackup(content) };
  } catch {
    return { workspace: fallback, warning: 'Saved workspace data was invalid, so CreatorDock started safely with an empty workspace.' };
  }
}

export function saveWorkspace(workspace: Workspace, storage?: StorageLike): boolean {
  if (storage === undefined) return false;
  try {
    storage.setItem(STORAGE_KEY, serializeWorkspace(workspace));
    return true;
  } catch {
    return false;
  }
}
