import { useRef, useState } from 'react';
import { serializeBackup } from '../storage';
import type { Theme, Workspace } from '../types';
import { Icon } from './Icon';

interface SettingsModalProps {
  workspace: Workspace;
  onThemeChange: (theme: Theme) => void;
  onImport: (content: string) => void;
  onClearProjects: () => void;
  onClose: () => void;
}

export function SettingsModal({ workspace, onThemeChange, onImport, onClearProjects, onClose }: SettingsModalProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState('');

  const exportBackup = () => {
    const blob = new Blob([serializeBackup(workspace)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `creatordock-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importFile = async (file?: File) => {
    if (file === undefined) return;
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error('Backup exceeds the 2 MiB import limit.');
      onImport(await file.text());
      setImportError('');
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Could not read that backup.');
    } finally {
      if (fileInput.current !== null) fileInput.current.value = '';
    }
  };

  return (
    <div className="modal-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-card settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <header className="modal-header"><div><span className="eyebrow">Your workspace</span><h2 id="settings-title">Settings &amp; backup</h2></div><button className="icon-button" aria-label="Close settings" onClick={onClose}><Icon name="x" /></button></header>
        <div className="modal-body settings-body">
          <section className="settings-section"><div><h3>Appearance</h3><p>Choose how CreatorDock looks on this device.</p></div><div className="theme-picker">{(['system', 'light', 'dark'] as const).map((theme) => <button className={workspace.settings.theme === theme ? 'active' : ''} key={theme} onClick={() => onThemeChange(theme)}>{theme === 'system' && <Icon name="settings" />}{theme === 'light' && <Icon name="sun" />}{theme === 'dark' && <Icon name="moon" />}<span>{theme[0]?.toUpperCase()}{theme.slice(1)}</span></button>)}</div></section>
          <section className="settings-section"><div><h3>Portable backup</h3><p>Export everything to one JSON file or restore a previous backup. Importing replaces the current workspace after validation.</p></div><div className="settings-actions"><button className="secondary-button" onClick={exportBackup}><Icon name="download" size={17} /> Export backup</button><button className="secondary-button" onClick={() => fileInput.current?.click()}><Icon name="upload" size={17} /> Import backup</button><input ref={fileInput} className="sr-only" type="file" accept="application/json,.json" onChange={(event) => { void importFile(event.target.files?.[0]); }} />{importError !== '' && <p className="form-error" role="alert">{importError}</p>}</div></section>
          <section className="settings-section privacy-settings"><div><h3>Private by default</h3><p>CreatorDock has no account, analytics, advertising, or application network client. Projects are stored in this browser. External resource links open only when you choose them.</p></div><span className="local-badge"><span className="privacy-dot" /> Local storage active</span></section>
          <section className="settings-section danger-zone"><div><h3>Clear projects</h3><p>Remove all projects while keeping your custom templates and appearance setting.</p></div><button className="danger-button" onClick={() => { if (window.confirm('Clear every project? Export a backup first if you may need them later.')) onClearProjects(); }}><Icon name="trash" size={17} /> Clear all projects</button></section>
        </div>
        <footer className="modal-footer"><span className="settings-count">{workspace.projects.length} projects · {workspace.templates.filter((template) => !template.builtIn).length} custom templates</span><button className="primary-button" onClick={onClose}>Done</button></footer>
      </section>
    </div>
  );
}
