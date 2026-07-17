export const PROJECT_STATUSES = ['idea', 'planning', 'producing', 'editing', 'scheduled', 'published'] as const;
export const PROJECT_PRIORITIES = ['low', 'normal', 'high'] as const;
export const THEMES = ['system', 'light', 'dark'] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type ProjectPriority = (typeof PROJECT_PRIORITIES)[number];
export type Theme = (typeof THEMES)[number];

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface ResourceLink {
  id: string;
  label: string;
  url: string;
}

export interface CreatorProject {
  id: string;
  title: string;
  contentType: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  targetDate: string;
  hook: string;
  objective: string;
  audience: string;
  notes: string;
  tags: string[];
  checklist: ChecklistItem[];
  resources: ResourceLink[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  checklist: string[];
  builtIn: boolean;
}

export interface WorkspaceSettings {
  theme: Theme;
}

export interface Workspace {
  version: 1;
  projects: CreatorProject[];
  templates: ProjectTemplate[];
  settings: WorkspaceSettings;
}

export interface ProjectDraft {
  title: string;
  contentType: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  targetDate: string;
  hook: string;
  objective: string;
  audience: string;
  notes: string;
  tags: string[];
  checklist: ChecklistItem[];
  resources: ResourceLink[];
}

export type ViewName = 'overview' | 'pipeline' | 'calendar' | 'templates';
