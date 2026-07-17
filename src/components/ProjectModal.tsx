import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { createId, draftFromTemplate, projectToDraft, STATUS_META } from '../domain';
import { isSafeResourceUrl } from '../storage';
import {
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  type CreatorProject,
  type ProjectDraft,
  type ProjectPriority,
  type ProjectStatus,
  type ProjectTemplate,
} from '../types';
import { Icon } from './Icon';

interface ProjectModalProps {
  project?: CreatorProject | undefined;
  template?: ProjectTemplate | undefined;
  initialStatus?: ProjectStatus | undefined;
  onSave: (draft: ProjectDraft) => void;
  onDelete?: (() => void) | undefined;
  onDuplicate?: (() => void) | undefined;
  onClose: () => void;
}

type Tab = 'brief' | 'checklist' | 'resources';

export function ProjectModal({ project, template, initialStatus, onSave, onDelete, onDuplicate, onClose }: ProjectModalProps) {
  const [draft, setDraft] = useState<ProjectDraft>(() => project === undefined
    ? draftFromTemplate(template, initialStatus ?? 'idea')
    : projectToDraft(project));
  const [tab, setTab] = useState<Tab>('brief');
  const [tags, setTags] = useState(draft.tags.join(', '));
  const [newTask, setNewTask] = useState('');
  const [resourceLabel, setResourceLabel] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  const update = <K extends keyof ProjectDraft>(key: K, value: ProjectDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const addTask = () => {
    const label = newTask.trim();
    if (label === '') return;
    if (draft.checklist.length >= 100) return setError('A project can contain up to 100 checklist items.');
    update('checklist', [...draft.checklist, { id: createId(), label: label.slice(0, 240), done: false }]);
    setNewTask('');
  };

  const addResource = () => {
    const label = resourceLabel.trim();
    const url = resourceUrl.trim();
    if (label === '' || url === '') return setError('Add both a resource label and URL.');
    if (!isSafeResourceUrl(url)) return setError('Resource URLs must begin with http:// or https://.');
    if (draft.resources.length >= 50) return setError('A project can contain up to 50 resources.');
    update('resources', [...draft.resources, { id: createId(), label: label.slice(0, 160), url: url.slice(0, 2_000) }]);
    setResourceLabel('');
    setResourceUrl('');
    setError('');
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const title = draft.title.trim();
    if (title === '') return setError('Give the project a working title.');
    const cleanedTags = [...new Set(tags.split(',').map((tag) => tag.trim().replace(/^#/u, '')).filter(Boolean))].slice(0, 12);
    if (cleanedTags.some((tag) => tag.length > 40)) return setError('Tags must be 40 characters or shorter.');
    onSave({
      ...draft,
      title: title.slice(0, 120),
      contentType: draft.contentType.trim().slice(0, 80),
      hook: draft.hook.trim().slice(0, 500),
      objective: draft.objective.trim().slice(0, 500),
      audience: draft.audience.trim().slice(0, 240),
      notes: draft.notes.trim().slice(0, 8_000),
      tags: cleanedTags,
    });
  };

  return (
    <div className="modal-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form className="modal-card project-modal" role="dialog" aria-modal="true" aria-labelledby="project-modal-title" onSubmit={submit}>
        <header className="modal-header project-modal-header">
          <div>
            <span className="eyebrow">{project === undefined ? 'New creative project' : 'Project workspace'}</span>
            <h2 id="project-modal-title">{project === undefined ? 'Set the direction' : project.title}</h2>
          </div>
          <button type="button" className="icon-button" aria-label="Close project" onClick={onClose}><Icon name="x" /></button>
        </header>

        <nav className="modal-tabs" aria-label="Project sections">
          {(['brief', 'checklist', 'resources'] as const).map((item) => (
            <button type="button" key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>
              {item === 'brief' && <Icon name="edit" size={17} />}
              {item === 'checklist' && <Icon name="check" size={17} />}
              {item === 'resources' && <Icon name="link" size={17} />}
              {item[0]?.toUpperCase()}{item.slice(1)}
              {item === 'checklist' && <span>{draft.checklist.filter((task) => task.done).length}/{draft.checklist.length}</span>}
              {item === 'resources' && <span>{draft.resources.length}</span>}
            </button>
          ))}
        </nav>

        <div className="modal-body">
          {error !== '' && <p className="form-error" role="alert">{error}<button type="button" aria-label="Dismiss error" onClick={() => setError('')}><Icon name="x" size={15} /></button></p>}

          {tab === 'brief' && (
            <div className="form-stack">
              <label className="full-field"><span>Working title <strong>*</strong></span><input autoFocus value={draft.title} maxLength={120} onChange={(event) => update('title', event.target.value)} placeholder="The clear, useful working title" /></label>
              <div className="form-grid three">
                <label><span>Content type</span><input value={draft.contentType} maxLength={80} onChange={(event) => update('contentType', event.target.value)} placeholder="Video, article, episode…" /></label>
                <label><span>Status</span><div className="select-wrap"><span className={`status-dot tone-${STATUS_META[draft.status].tone}`} /><select value={draft.status} onChange={(event) => update('status', event.target.value as ProjectStatus)}>{PROJECT_STATUSES.map((status) => <option key={status} value={status}>{STATUS_META[status].label}</option>)}</select><Icon name="chevron-down" size={15} /></div></label>
                <label><span>Priority</span><div className="select-wrap"><select value={draft.priority} onChange={(event) => update('priority', event.target.value as ProjectPriority)}>{PROJECT_PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority[0]?.toUpperCase()}{priority.slice(1)}</option>)}</select><Icon name="chevron-down" size={15} /></div></label>
              </div>
              <div className="form-grid two">
                <label><span>Target date</span><input type="date" value={draft.targetDate} onChange={(event) => update('targetDate', event.target.value)} /></label>
                <label><span>Tags</span><input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="education, launch, tutorial" /><small>Separate tags with commas.</small></label>
              </div>
              <label><span>Opening hook</span><textarea value={draft.hook} maxLength={500} rows={3} onChange={(event) => update('hook', event.target.value)} placeholder="What makes someone want to keep going?" /></label>
              <label><span>Objective</span><textarea value={draft.objective} maxLength={500} rows={3} onChange={(event) => update('objective', event.target.value)} placeholder="What should this project accomplish?" /></label>
              <label><span>Intended audience</span><input value={draft.audience} maxLength={240} onChange={(event) => update('audience', event.target.value)} placeholder="Who is this specifically for?" /></label>
              <label><span>Working notes</span><textarea value={draft.notes} maxLength={8_000} rows={6} onChange={(event) => update('notes', event.target.value)} placeholder="Research, structure, constraints, loose thoughts…" /></label>
            </div>
          )}

          {tab === 'checklist' && (
            <div className="project-list-section">
              <div className="section-heading compact"><div><h3>Production checklist</h3><p>Break the project into finishable steps.</p></div><span>{draft.checklist.filter((item) => item.done).length} complete</span></div>
              <div className="task-list">
                {draft.checklist.map((item) => (
                  <div className={`task-row ${item.done ? 'done' : ''}`} key={item.id}>
                    <label><input type="checkbox" checked={item.done} onChange={() => update('checklist', draft.checklist.map((current) => current.id === item.id ? { ...current, done: !current.done } : current))} /><span className="custom-check"><Icon name="check" size={14} /></span><input className="task-label-input" value={item.label} maxLength={240} aria-label="Checklist item" onChange={(event) => update('checklist', draft.checklist.map((current) => current.id === item.id ? { ...current, label: event.target.value } : current))} /></label>
                    <button type="button" className="icon-button small" aria-label={`Remove ${item.label}`} onClick={() => update('checklist', draft.checklist.filter((current) => current.id !== item.id))}><Icon name="x" size={16} /></button>
                  </div>
                ))}
                {draft.checklist.length === 0 && <div className="panel-empty"><Icon name="check" /><p>No steps yet. Add the first one below.</p></div>}
              </div>
              <div className="inline-add"><input value={newTask} maxLength={240} onChange={(event) => setNewTask(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addTask(); } }} placeholder="Add a production step" /><button type="button" onClick={addTask}><Icon name="plus" size={17} /> Add</button></div>
            </div>
          )}

          {tab === 'resources' && (
            <div className="project-list-section">
              <div className="section-heading compact"><div><h3>Reference links</h3><p>Keep research, assets, and source material close to the brief.</p></div></div>
              <div className="resource-list">
                {draft.resources.map((resource) => (
                  <div className="resource-row" key={resource.id}><span className="resource-icon"><Icon name="link" /></span><div><strong>{resource.label}</strong><a href={resource.url} target="_blank" rel="noreferrer">{resource.url} <Icon name="external" size={13} /></a></div><button type="button" className="icon-button small" aria-label={`Remove ${resource.label}`} onClick={() => update('resources', draft.resources.filter((item) => item.id !== resource.id))}><Icon name="x" size={16} /></button></div>
                ))}
                {draft.resources.length === 0 && <div className="panel-empty"><Icon name="link" /><p>No links attached to this project.</p></div>}
              </div>
              <div className="resource-add"><label><span>Label</span><input value={resourceLabel} maxLength={160} onChange={(event) => setResourceLabel(event.target.value)} placeholder="Research notes" /></label><label><span>URL</span><input type="url" value={resourceUrl} maxLength={2_000} onChange={(event) => setResourceUrl(event.target.value)} placeholder="https://…" /></label><button type="button" className="secondary-button" onClick={addResource}><Icon name="plus" size={17} /> Add link</button></div>
            </div>
          )}
        </div>

        <footer className="modal-footer project-footer">
          <div>{project !== undefined && <><button type="button" className="quiet-button" onClick={onDuplicate}><Icon name="copy" size={16} /> Duplicate</button><button type="button" className="quiet-button danger" onClick={() => { if (window.confirm(`Delete ${project.title}? This cannot be undone.`)) onDelete?.(); }}><Icon name="trash" size={16} /> Delete</button></>}</div>
          <div><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button">{project === undefined ? 'Create project' : 'Save changes'}</button></div>
        </footer>
      </form>
    </div>
  );
}
