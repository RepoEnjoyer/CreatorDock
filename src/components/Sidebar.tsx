import { Icon, type IconName } from './Icon';
import type { ViewName } from '../types';

interface SidebarProps {
  activeView: ViewName;
  open: boolean;
  projectCount: number;
  onNavigate: (view: ViewName) => void;
  onNewProject: () => void;
  onOpenSettings: () => void;
  onClose: () => void;
}

const navigation: Array<{ view: ViewName; label: string; icon: IconName }> = [
  { view: 'overview', label: 'Overview', icon: 'grid' },
  { view: 'pipeline', label: 'Pipeline', icon: 'layout' },
  { view: 'calendar', label: 'Calendar', icon: 'calendar' },
  { view: 'templates', label: 'Templates', icon: 'archive' },
];

export function Sidebar({
  activeView,
  open,
  projectCount,
  onNavigate,
  onNewProject,
  onOpenSettings,
  onClose,
}: SidebarProps) {
  const navigate = (view: ViewName) => {
    onNavigate(view);
    onClose();
  };

  return (
    <>
      <button className={`sidebar-backdrop ${open ? 'visible' : ''}`} aria-label="Close navigation" onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Primary navigation">
        <div className="brand">
          <span className="brand-mark"><Icon name="inbox" size={22} /></span>
          <span>CreatorDock</span>
        </div>

        <button className="new-project-button" onClick={onNewProject}>
          <Icon name="plus" size={19} />
          New project
          <kbd>N</kbd>
        </button>

        <nav className="nav-list">
          <p className="nav-label">Workspace</p>
          {navigation.map((item) => (
            <button
              key={item.view}
              className={activeView === item.view ? 'active' : ''}
              aria-current={activeView === item.view ? 'page' : undefined}
              onClick={() => navigate(item.view)}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {item.view === 'pipeline' && <span className="nav-count">{projectCount}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />
        <div className="privacy-note">
          <span className="privacy-dot" />
          <div><strong>Stored on this device</strong><span>No account or cloud sync</span></div>
        </div>
        <button className="settings-button" onClick={onOpenSettings}>
          <Icon name="settings" size={19} />
          Settings &amp; backup
        </button>
        <p className="sidebar-credit">Open source by RepoEnjoyer</p>
      </aside>
    </>
  );
}
