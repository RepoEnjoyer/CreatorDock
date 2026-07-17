import { useState } from 'react';
import type { ProjectTemplate } from '../types';
import { Icon } from './Icon';

interface TemplatesViewProps {
  templates: ProjectTemplate[];
  onUseTemplate: (template: ProjectTemplate) => void;
  onCreateTemplate: (template: Omit<ProjectTemplate, 'id' | 'builtIn'>) => void;
  onUpdateTemplate: (id: string, template: Omit<ProjectTemplate, 'id' | 'builtIn'>) => void;
  onDeleteTemplate: (id: string) => void;
}

interface TemplateEditorProps {
  template?: ProjectTemplate | undefined;
  onSave: (template: Omit<ProjectTemplate, 'id' | 'builtIn'>) => void;
  onClose: () => void;
}

function TemplateEditor({ template, onSave, onClose }: TemplateEditorProps) {
  const [name, setName] = useState(template?.name ?? '');
  const [description, setDescription] = useState(template?.description ?? '');
  const [items, setItems] = useState<string[]>(template?.checklist ?? ['']);
  const [error, setError] = useState('');

  const save = () => {
    const cleaned = items.map((item) => item.trim()).filter(Boolean);
    if (name.trim() === '') return setError('Give the template a name.');
    if (cleaned.length === 0) return setError('Add at least one checklist item.');
    onSave({ name: name.trim().slice(0, 100), description: description.trim().slice(0, 300), checklist: cleaned.slice(0, 100) });
  };

  return (
    <div className="modal-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-card template-modal" role="dialog" aria-modal="true" aria-labelledby="template-editor-title">
        <header className="modal-header"><div><span className="eyebrow">Reusable workflow</span><h2 id="template-editor-title">{template === undefined ? 'New template' : 'Edit template'}</h2></div><button className="icon-button" aria-label="Close" onClick={onClose}><Icon name="x" /></button></header>
        <div className="modal-body form-stack">
          {error !== '' && <p className="form-error" role="alert">{error}</p>}
          <label><span>Template name</span><input value={name} maxLength={100} onChange={(event) => setName(event.target.value)} placeholder="Weekly production" autoFocus /></label>
          <label><span>Description</span><textarea value={description} maxLength={300} onChange={(event) => setDescription(event.target.value)} placeholder="When should someone use this workflow?" rows={3} /></label>
          <div className="checklist-editor">
            <div className="field-heading"><span>Checklist</span><button type="button" onClick={() => setItems([...items, ''])}><Icon name="plus" size={16} /> Add item</button></div>
            {items.map((item, index) => (
              <div className="editable-list-row" key={index}><span>{index + 1}</span><input value={item} maxLength={240} onChange={(event) => setItems(items.map((current, currentIndex) => currentIndex === index ? event.target.value : current))} placeholder="Workflow step" /><button aria-label={`Remove step ${index + 1}`} onClick={() => setItems(items.filter((_, currentIndex) => currentIndex !== index))}><Icon name="x" size={17} /></button></div>
            ))}
          </div>
        </div>
        <footer className="modal-footer"><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" onClick={save}>Save template</button></footer>
      </section>
    </div>
  );
}

export function TemplatesView({ templates, onUseTemplate, onCreateTemplate, onUpdateTemplate, onDeleteTemplate }: TemplatesViewProps) {
  const [editing, setEditing] = useState<ProjectTemplate | 'new' | null>(null);

  return (
    <div className="view-shell templates-view">
      <header className="view-header">
        <div><span className="eyebrow">Repeat what works</span><h1>Templates</h1><p>Turn a reliable process into a reusable starting point.</p></div>
        <button className="primary-button" onClick={() => setEditing('new')}><Icon name="plus" /> New template</button>
      </header>
      <div className="template-grid">
        {templates.map((template, index) => (
          <article className="template-card" key={template.id}>
            <div className={`template-number template-color-${index % 5}`}>{String(index + 1).padStart(2, '0')}</div>
            <div className="template-card-header"><span className="template-kind">{template.builtIn ? 'Built in' : 'Custom'}</span>{!template.builtIn && <div><button className="icon-button small" aria-label={`Edit ${template.name}`} onClick={() => setEditing(template)}><Icon name="edit" size={16} /></button><button className="icon-button small danger" aria-label={`Delete ${template.name}`} onClick={() => { if (window.confirm(`Delete the ${template.name} template?`)) onDeleteTemplate(template.id); }}><Icon name="trash" size={16} /></button></div>}</div>
            <h2>{template.name}</h2>
            <p>{template.description}</p>
            <div className="template-steps"><span>{template.checklist.length} steps</span><div>{template.checklist.slice(0, 3).map((item) => <span key={item}><Icon name="check" size={13} /> {item}</span>)}</div></div>
            <button className="use-template" onClick={() => onUseTemplate(template)}>Use template <Icon name="arrow-right" size={17} /></button>
          </article>
        ))}
      </div>
      {editing !== null && (
        <TemplateEditor
          template={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onSave={(value) => {
            if (editing === 'new') onCreateTemplate(value);
            else onUpdateTemplate(editing.id, value);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
