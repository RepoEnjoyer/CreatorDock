import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { CalendarView } from './components/CalendarView';
import { Dashboard } from './components/Dashboard';
import { Icon } from './components/Icon';
import { Pipeline } from './components/Pipeline';
import { ProjectModal } from './components/ProjectModal';
import { SettingsModal } from './components/SettingsModal';
import { Sidebar } from './components/Sidebar';
import { TemplatesView } from './components/TemplatesView';
import { loadWorkspace, parseBackup, saveWorkspace } from './storage';
import type { CreatorProject, ProjectDraft, ProjectStatus, ProjectTemplate, ViewName } from './types';
import { workspaceReducer } from './workspace';

interface ModalState {
  projectId?: string;
  templateId?: string;
  initialStatus?: ProjectStatus;
}

const viewLabels: Record<ViewName, string> = {
  overview: 'Overview',
  pipeline: 'Pipeline',
  calendar: 'Calendar',
  templates: 'Templates',
};

export default function App() {
  const initial = useMemo(() => loadWorkspace(typeof window === 'undefined' ? undefined : window.localStorage), []);
  const [workspace, dispatch] = useReducer(workspaceReducer, initial.workspace);
  const [view, setView] = useState<ViewName>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projectModal, setProjectModal] = useState<ModalState | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState(initial.warning ?? '');
  const [storageFailed, setStorageFailed] = useState(false);

  useEffect(() => {
    const saved = saveWorkspace(workspace, window.localStorage);
    setStorageFailed(!saved);
  }, [workspace]);

  useEffect(() => {
    const root = document.documentElement;
    if (workspace.settings.theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = workspace.settings.theme;
  }, [workspace.settings.theme]);

  useEffect(() => {
    if (toast === '') return undefined;
    const timer = window.setTimeout(() => setToast(''), 4_500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const openNewProject = useCallback((status?: ProjectStatus, template?: ProjectTemplate) => {
    setProjectModal({
      ...(status === undefined ? {} : { initialStatus: status }),
      ...(template === undefined ? {} : { templateId: template.id }),
    });
  }, []);

  useEffect(() => {
    const shortcuts = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editing = target?.matches('input, textarea, select, [contenteditable="true"]') ?? false;
      if (!editing && event.key.toLowerCase() === 'n' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        openNewProject();
      }
    };
    window.addEventListener('keydown', shortcuts);
    return () => window.removeEventListener('keydown', shortcuts);
  }, [openNewProject]);

  const selectedProject = projectModal?.projectId === undefined
    ? undefined
    : workspace.projects.find((project) => project.id === projectModal.projectId);
  const selectedTemplate = projectModal?.templateId === undefined
    ? undefined
    : workspace.templates.find((template) => template.id === projectModal.templateId);

  const openProject = (project: CreatorProject) => setProjectModal({ projectId: project.id });
  const moveProject = (id: string, status: ProjectStatus) => dispatch({ type: 'project/move', id, status });

  const saveProject = (draft: ProjectDraft) => {
    if (selectedProject === undefined) {
      dispatch({ type: 'project/create', draft });
      setToast('Project created.');
    } else {
      dispatch({ type: 'project/update', id: selectedProject.id, draft });
      setToast('Changes saved.');
    }
    setProjectModal(null);
  };

  const importBackup = (content: string) => {
    const imported = parseBackup(content);
    if (!window.confirm(`Replace this workspace with a backup containing ${imported.projects.length} projects?`)) return;
    dispatch({ type: 'workspace/replace', workspace: imported });
    setToast('Backup restored.');
    setSettingsOpen(false);
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Sidebar
        activeView={view}
        open={sidebarOpen}
        projectCount={workspace.projects.length}
        onNavigate={setView}
        onNewProject={() => openNewProject()}
        onOpenSettings={() => { setSettingsOpen(true); setSidebarOpen(false); }}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main-column">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Icon name="menu" /></button>
          <div><span className="topbar-label">Workspace</span><strong>{viewLabels[view]}</strong></div>
          <div className="topbar-actions">
            {storageFailed && <span className="storage-warning" title="Changes could not be saved"><span /> Storage unavailable</span>}
            <button className="topbar-settings" onClick={() => setSettingsOpen(true)}><Icon name="settings" size={18} /><span>Settings</span></button>
            <button className="quick-add" onClick={() => openNewProject()} aria-label="Create project"><Icon name="plus" /></button>
          </div>
        </header>

        <main id="main-content">
          {view === 'overview' && <Dashboard projects={workspace.projects} onNewProject={() => openNewProject()} onOpenProject={openProject} onMoveProject={moveProject} onOpenPipeline={() => setView('pipeline')} />}
          {view === 'pipeline' && <Pipeline projects={workspace.projects} onNewProject={(status) => openNewProject(status)} onOpenProject={openProject} onMoveProject={moveProject} />}
          {view === 'calendar' && <CalendarView projects={workspace.projects} onNewProject={() => openNewProject()} onOpenProject={openProject} />}
          {view === 'templates' && <TemplatesView templates={workspace.templates} onUseTemplate={(template) => openNewProject(undefined, template)} onCreateTemplate={(template) => { dispatch({ type: 'template/create', template }); setToast('Template created.'); }} onUpdateTemplate={(id, template) => { dispatch({ type: 'template/update', id, template }); setToast('Template updated.'); }} onDeleteTemplate={(id) => { dispatch({ type: 'template/delete', id }); setToast('Template deleted.'); }} />}
        </main>
      </div>

      {projectModal !== null && (
        <ProjectModal
          project={selectedProject}
          template={selectedTemplate}
          initialStatus={projectModal.initialStatus}
          onClose={() => setProjectModal(null)}
          onSave={saveProject}
          onDelete={selectedProject === undefined ? undefined : () => { dispatch({ type: 'project/delete', id: selectedProject.id }); setProjectModal(null); setToast('Project deleted.'); }}
          onDuplicate={selectedProject === undefined ? undefined : () => { dispatch({ type: 'project/duplicate', id: selectedProject.id }); setProjectModal(null); setToast('Project duplicated into Ideas.'); }}
        />
      )}
      {settingsOpen && <SettingsModal workspace={workspace} onThemeChange={(theme) => dispatch({ type: 'settings/theme', theme })} onImport={importBackup} onClearProjects={() => { dispatch({ type: 'workspace/clear-projects' }); setToast('Projects cleared.'); }} onClose={() => setSettingsOpen(false)} />}
      {toast !== '' && <div className="toast" role="status"><Icon name="check" size={18} /> {toast}<button aria-label="Dismiss notification" onClick={() => setToast('')}><Icon name="x" size={15} /></button></div>}
    </div>
  );
}
