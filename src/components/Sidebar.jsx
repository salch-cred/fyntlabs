import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Search, 
  Settings, 
  PlusCircle, 
  FileText, 
  Share2, 
  Moon, 
  Sun,
  ChevronsLeft
} from 'lucide-react';

const Sidebar = ({ isOpen, theme, toggleTheme }) => {
  return (
    <aside className={`sidebar ${!isOpen ? 'collapsed' : ''}`}>
      {/* Workspace Header */}
      <div className="sidebar-header">
        <div style={{ width: 20, height: 20, backgroundColor: '#E03E3E', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: 12 }}>
          S
        </div>
        <span style={{ flex: 1 }}>Salma's Workspace</span>
        <ChevronsLeft size={16} className="text-secondary" />
      </div>

      <div style={{ padding: '0 8px' }}>
        <div className="sidebar-item">
          <Search size={16} />
          <span>Search</span>
        </div>
        <div className="sidebar-item">
          <Settings size={16} />
          <span>Settings</span>
        </div>
        <div className="sidebar-item">
          <PlusCircle size={16} />
          <span>New Page</span>
        </div>
      </div>

      <div style={{ padding: '16px 8px 8px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
        PRIVATE
      </div>
      
      <div style={{ padding: '0 8px', flex: 1 }}>
        <NavLink to="/" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
          <FileText size={16} />
          <span>Getting Started</span>
        </NavLink>
        <NavLink to="/canvas" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
          <Share2 size={16} />
          <span>Workflow Automation</span>
        </NavLink>
      </div>

      {/* Footer / Theme Toggle */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--border-color)' }}>
        <div className="sidebar-item" onClick={toggleTheme} style={{ justifyContent: 'space-between' }}>
          <div className="flex items-center gap-2">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
