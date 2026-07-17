import { BUILT_IN_TEMPLATES, createProject, createId, projectToDraft } from './domain';
import type {
  CreatorProject,
  ProjectDraft,
  ProjectStatus,
  ProjectTemplate,
  Theme,
  Workspace,
} from './types';

export type WorkspaceAction =
  | { type: 'project/create'; draft: ProjectDraft }
  | { type: 'project/update'; id: string; draft: ProjectDraft }
  | { type: 'project/delete'; id: string }
  | { type: 'project/duplicate'; id: string }
  | { type: 'project/move'; id: string; status: ProjectStatus }
  | { type: 'project/toggle-task'; projectId: string; taskId: string }
  | { type: 'template/create'; template: Omit<ProjectTemplate, 'id' | 'builtIn'> }
  | { type: 'template/update'; id: string; template: Omit<ProjectTemplate, 'id' | 'builtIn'> }
  | { type: 'template/delete'; id: string }
  | { type: 'settings/theme'; theme: Theme }
  | { type: 'workspace/replace'; workspace: Workspace }
  | { type: 'workspace/clear-projects' };

function updateProject(workspace: Workspace, id: string, update: (project: CreatorProject) => CreatorProject): Workspace {
  return {
    ...workspace,
    projects: workspace.projects.map((project) => project.id === id ? update(project) : project),
  };
}

export function workspaceReducer(workspace: Workspace, action: WorkspaceAction): Workspace {
  switch (action.type) {
    case 'project/create':
      return { ...workspace, projects: [createProject(action.draft), ...workspace.projects] };
    case 'project/update':
      return updateProject(workspace, action.id, (project) => ({
        ...project,
        ...action.draft,
        checklist: action.draft.checklist.map((item) => ({ ...item })),
        resources: action.draft.resources.map((resource) => ({ ...resource })),
        updatedAt: new Date().toISOString(),
      }));
    case 'project/delete':
      return { ...workspace, projects: workspace.projects.filter((project) => project.id !== action.id) };
    case 'project/duplicate': {
      const source = workspace.projects.find((project) => project.id === action.id);
      if (source === undefined) return workspace;
      const draft = projectToDraft(source);
      return {
        ...workspace,
        projects: [createProject({
          ...draft,
          title: `${draft.title} copy`.slice(0, 120),
          status: 'idea',
          checklist: draft.checklist.map((item) => ({ ...item, id: createId(), done: false })),
          resources: draft.resources.map((resource) => ({ ...resource, id: createId() })),
        }), ...workspace.projects],
      };
    }
    case 'project/move':
      return updateProject(workspace, action.id, (project) => ({
        ...project,
        status: action.status,
        updatedAt: new Date().toISOString(),
      }));
    case 'project/toggle-task':
      return updateProject(workspace, action.projectId, (project) => ({
        ...project,
        checklist: project.checklist.map((item) => item.id === action.taskId ? { ...item, done: !item.done } : item),
        updatedAt: new Date().toISOString(),
      }));
    case 'template/create':
      return {
        ...workspace,
        templates: [...workspace.templates, { ...action.template, id: createId(), builtIn: false }],
      };
    case 'template/update':
      return {
        ...workspace,
        templates: workspace.templates.map((template) =>
          template.id === action.id && !template.builtIn ? { ...template, ...action.template } : template),
      };
    case 'template/delete':
      return { ...workspace, templates: workspace.templates.filter((template) => template.builtIn || template.id !== action.id) };
    case 'settings/theme':
      return { ...workspace, settings: { ...workspace.settings, theme: action.theme } };
    case 'workspace/replace':
      return action.workspace;
    case 'workspace/clear-projects':
      return {
        ...workspace,
        projects: [],
        templates: [
          ...BUILT_IN_TEMPLATES.map((template) => ({ ...template, checklist: [...template.checklist] })),
          ...workspace.templates.filter((template) => !template.builtIn),
        ],
      };
  }
}
