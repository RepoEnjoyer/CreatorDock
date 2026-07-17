import { useMemo, useState } from 'react';
import { formatDate, getMonthGrid, STATUS_META, todayIso } from '../domain';
import type { CreatorProject } from '../types';
import { Icon } from './Icon';

interface CalendarViewProps {
  projects: CreatorProject[];
  onNewProject: () => void;
  onOpenProject: (project: CreatorProject) => void;
}

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarView({ projects, onNewProject, onOpenProject }: CalendarViewProps) {
  const now = new Date();
  const [cursor, setCursor] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const days = useMemo(() => getMonthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const monthLabel = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(cursor);

  const moveMonth = (amount: number) => setCursor((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));

  return (
    <div className="view-shell calendar-view">
      <header className="view-header">
        <div><span className="eyebrow">Publishing rhythm</span><h1>Calendar</h1><p>See deadlines and scheduled work in one place.</p></div>
        <button className="primary-button" onClick={onNewProject}><Icon name="plus" /> New project</button>
      </header>

      <section className="calendar-panel">
        <div className="calendar-toolbar">
          <div><button aria-label="Previous month" onClick={() => moveMonth(-1)}><Icon name="arrow-left" /></button><button className="today-button" onClick={() => setCursor(new Date(now.getFullYear(), now.getMonth(), 1))}>Today</button><button aria-label="Next month" onClick={() => moveMonth(1)}><Icon name="arrow-right" /></button></div>
          <h2>{monthLabel}</h2>
          <span>{projects.filter((project) => project.targetDate !== '').length} dated projects</span>
        </div>
        <div className="calendar-grid" role="grid" aria-label={monthLabel}>
          {weekdays.map((day) => <div className="weekday" role="columnheader" key={day}>{day}</div>)}
          {days.map((day) => {
            const iso = todayIso(day);
            const dayProjects = projects.filter((project) => project.targetDate === iso);
            const outside = day.getMonth() !== cursor.getMonth();
            return (
              <div className={`calendar-day ${outside ? 'outside' : ''} ${iso === todayIso() ? 'today' : ''}`} role="gridcell" key={iso}>
                <span className="day-number">{day.getDate()}</span>
                <div className="day-projects">
                  {dayProjects.slice(0, 3).map((project) => (
                    <button className={`calendar-project tone-${STATUS_META[project.status].tone}`} key={project.id} onClick={() => onOpenProject(project)} title={`${project.title}, ${formatDate(project.targetDate)}`}>
                      <span>{project.title}</span>
                    </button>
                  ))}
                  {dayProjects.length > 3 && <span className="more-projects">+{dayProjects.length - 3} more</span>}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
