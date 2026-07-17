import { formatDate, isOverdue, STATUS_META, todayIso } from '../domain';
import type { CreatorProject, ProjectStatus } from '../types';
import { Icon } from './Icon';
import { ProjectCard } from './ProjectCard';

interface DashboardProps {
  projects: CreatorProject[];
  onNewProject: () => void;
  onOpenProject: (project: CreatorProject) => void;
  onMoveProject: (id: string, status: ProjectStatus) => void;
  onOpenPipeline: () => void;
}

function daysFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return todayIso(date);
}

export function Dashboard({ projects, onNewProject, onOpenProject, onMoveProject, onOpenPipeline }: DashboardProps) {
  const today = todayIso();
  const weekEnd = daysFromToday(7);
  const active = projects.filter((project) => !['published', 'scheduled'].includes(project.status));
  const dueSoon = projects
    .filter((project) => project.targetDate !== '' && project.targetDate <= weekEnd && project.status !== 'published')
    .sort((a, b) => a.targetDate.localeCompare(b.targetDate));
  const published = projects.filter((project) => project.status === 'published').length;
  const scheduled = projects.filter((project) => project.status === 'scheduled').length;
  const recent = [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4);

  return (
    <div className="view-shell dashboard-view">
      <section className="hero-panel">
        <div>
          <span className="eyebrow"><Icon name="spark" size={16} /> Creative command centre</span>
          <h1>Keep every idea moving.</h1>
          <p>Plan the work, see what is stuck, and finish with less tab-switching.</p>
        </div>
        <button className="primary-button hero-action" onClick={onNewProject}><Icon name="plus" /> Start a project</button>
      </section>

      <section className="metric-grid" aria-label="Workspace summary">
        <article className="metric-card metric-active">
          <div className="metric-icon"><Icon name="inbox" /></div>
          <div><span className="metric-value">{active.length}</span><span className="metric-label">In progress</span></div>
          <span className="metric-foot">Across planning and production</span>
        </article>
        <article className="metric-card metric-due">
          <div className="metric-icon"><Icon name="clock" /></div>
          <div><span className="metric-value">{dueSoon.length}</span><span className="metric-label">Due this week</span></div>
          <span className="metric-foot">{dueSoon.filter((project) => isOverdue(project, today)).length} already overdue</span>
        </article>
        <article className="metric-card metric-ready">
          <div className="metric-icon"><Icon name="calendar" /></div>
          <div><span className="metric-value">{scheduled}</span><span className="metric-label">Ready to ship</span></div>
          <span className="metric-foot">Scheduled and waiting</span>
        </article>
        <article className="metric-card metric-live">
          <div className="metric-icon"><Icon name="check" /></div>
          <div><span className="metric-value">{published}</span><span className="metric-label">Completed</span></div>
          <span className="metric-foot">All-time in this workspace</span>
        </article>
      </section>

      {projects.length === 0 ? (
        <section className="empty-workspace">
          <div className="empty-illustration" aria-hidden="true">
            <span className="empty-sheet one" /><span className="empty-sheet two" /><span className="empty-sheet three" />
          </div>
          <div>
            <span className="eyebrow">Blank dock, full potential</span>
            <h2>Bring your next idea aboard.</h2>
            <p>Projects stay in this browser. Start from scratch or use one of the built-in production templates.</p>
            <button className="primary-button" onClick={onNewProject}><Icon name="plus" /> Create the first project</button>
          </div>
        </section>
      ) : (
        <div className="dashboard-columns">
          <section className="dashboard-panel">
            <div className="section-heading">
              <div><span className="eyebrow">Next up</span><h2>Deadlines on deck</h2></div>
              <button className="text-button" onClick={onOpenPipeline}>Full pipeline <Icon name="arrow-right" size={16} /></button>
            </div>
            {dueSoon.length > 0 ? (
              <div className="deadline-list">
                {dueSoon.slice(0, 5).map((project) => (
                  <button key={project.id} onClick={() => onOpenProject(project)}>
                    <span className={`deadline-date ${isOverdue(project) ? 'late' : ''}`}>
                      <strong>{formatDate(project.targetDate, { day: '2-digit' })}</strong>
                      <small>{formatDate(project.targetDate, { month: 'short' })}</small>
                    </span>
                    <span className="deadline-copy"><strong>{project.title}</strong><small>{project.contentType || 'Creative project'}</small></span>
                    <span className={`status-pill tone-${STATUS_META[project.status].tone}`}>{STATUS_META[project.status].shortLabel}</span>
                    <Icon name="arrow-right" size={17} />
                  </button>
                ))}
              </div>
            ) : <div className="panel-empty"><Icon name="calendar" /><p>No deadlines in the next seven days.</p></div>}
          </section>

          <section className="dashboard-panel recent-panel">
            <div className="section-heading"><div><span className="eyebrow">Recently touched</span><h2>Pick up where you left off</h2></div></div>
            <div className="recent-grid">
              {recent.map((project) => (
                <ProjectCard key={project.id} project={project} compact onOpen={onOpenProject} onMove={onMoveProject} />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
