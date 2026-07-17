import { checklistProgress, formatDate, isOverdue, STATUS_META } from '../domain';
import { PROJECT_STATUSES, type CreatorProject, type ProjectStatus } from '../types';
import { Icon } from './Icon';

interface ProjectCardProps {
  project: CreatorProject;
  compact?: boolean;
  onOpen: (project: CreatorProject) => void;
  onMove: (id: string, status: ProjectStatus) => void;
  onDragStart?: (id: string) => void;
}

export function ProjectCard({ project, compact = false, onOpen, onMove, onDragStart }: ProjectCardProps) {
  const progress = checklistProgress(project);
  const completed = project.checklist.filter((item) => item.done).length;

  return (
    <article
      className={`project-card ${compact ? 'compact' : ''} priority-${project.priority}`}
      draggable={!compact}
      onDragStart={() => onDragStart?.(project.id)}
    >
      <button className="project-card-main" onClick={() => onOpen(project)} aria-label={`Open ${project.title}`}>
        <div className="project-card-topline">
          {project.contentType !== '' ? <span className="content-type">{project.contentType}</span> : <span className="content-type muted">Uncategorized</span>}
          {project.priority === 'high' && <span className="priority-flag">High priority</span>}
        </div>
        <h3>{project.title}</h3>
        {project.hook !== '' && !compact && <p className="project-hook">{project.hook}</p>}
        <div className="project-meta">
          <span className={isOverdue(project) ? 'overdue' : ''}>
            <Icon name="calendar" size={15} /> {formatDate(project.targetDate)}
          </span>
          {project.checklist.length > 0 && <span><Icon name="check" size={15} /> {completed}/{project.checklist.length}</span>}
        </div>
        {project.checklist.length > 0 && !compact && (
          <div className="progress-track" aria-label={`${progress}% checklist complete`}>
            <span style={{ width: `${progress}%` }} />
          </div>
        )}
        {project.tags.length > 0 && !compact && (
          <div className="tag-row">
            {project.tags.slice(0, 3).map((tag) => <span key={tag}>#{tag}</span>)}
            {project.tags.length > 3 && <span>+{project.tags.length - 3}</span>}
          </div>
        )}
      </button>
      {!compact && (
        <label className="card-status-select">
          <span className="sr-only">Move {project.title}</span>
          <span className={`status-dot tone-${STATUS_META[project.status].tone}`} />
          <select value={project.status} onChange={(event) => onMove(project.id, event.target.value as ProjectStatus)}>
            {PROJECT_STATUSES.map((status) => <option key={status} value={status}>{STATUS_META[status].shortLabel}</option>)}
          </select>
          <Icon name="chevron-down" size={14} />
        </label>
      )}
    </article>
  );
}
