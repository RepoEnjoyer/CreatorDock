import { useMemo, useState } from 'react';
import { PROJECT_PRIORITIES, PROJECT_STATUSES, type CreatorProject, type ProjectPriority, type ProjectStatus } from '../types';
import { STATUS_META } from '../domain';
import { Icon } from './Icon';
import { ProjectCard } from './ProjectCard';

interface PipelineProps {
  projects: CreatorProject[];
  onNewProject: (status?: ProjectStatus) => void;
  onOpenProject: (project: CreatorProject) => void;
  onMoveProject: (id: string, status: ProjectStatus) => void;
}

export function Pipeline({ projects, onNewProject, onOpenProject, onMoveProject }: PipelineProps) {
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState<ProjectPriority | 'all'>('all');
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesQuery = normalized === '' || [project.title, project.contentType, project.hook, ...project.tags]
        .some((value) => value.toLowerCase().includes(normalized));
      return matchesQuery && (priority === 'all' || project.priority === priority);
    });
  }, [priority, projects, query]);

  const dropInto = (status: ProjectStatus) => {
    if (draggedId !== null) onMoveProject(draggedId, status);
    setDraggedId(null);
  };

  return (
    <div className="view-shell pipeline-view">
      <header className="view-header">
        <div><span className="eyebrow">Production flow</span><h1>Pipeline</h1><p>Move work from first thought to finished piece.</p></div>
        <button className="primary-button" onClick={() => onNewProject()}><Icon name="plus" /> New project</button>
      </header>

      <div className="toolbar">
        <label className="search-box"><Icon name="search" /><span className="sr-only">Search projects</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects, hooks, or tags" /></label>
        <label className="filter-select"><Icon name="filter" /><span className="sr-only">Filter by priority</span><select value={priority} onChange={(event) => setPriority(event.target.value as ProjectPriority | 'all')}><option value="all">All priorities</option>{PROJECT_PRIORITIES.map((item) => <option key={item} value={item}>{item[0]?.toUpperCase()}{item.slice(1)} priority</option>)}</select><Icon name="chevron-down" size={15} /></label>
        <span className="result-count">{filtered.length} of {projects.length} projects</span>
      </div>

      <div className="kanban" aria-label="Project pipeline">
        {PROJECT_STATUSES.map((status) => {
          const columnProjects = filtered.filter((project) => project.status === status);
          const meta = STATUS_META[status];
          return (
            <section
              className={`kanban-column tone-border-${meta.tone}`}
              key={status}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => dropInto(status)}
            >
              <header>
                <span className={`status-dot tone-${meta.tone}`} />
                <h2>{meta.label}</h2>
                <span className="column-count">{columnProjects.length}</span>
                <button aria-label={`Add project to ${meta.label}`} onClick={() => onNewProject(status)}><Icon name="plus" size={18} /></button>
              </header>
              <div className="kanban-cards">
                {columnProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} onOpen={onOpenProject} onMove={onMoveProject} onDragStart={setDraggedId} />
                ))}
                {columnProjects.length === 0 && (
                  <button className="empty-column" onClick={() => onNewProject(status)}><Icon name="plus" /> Add {meta.shortLabel.toLowerCase()}</button>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
