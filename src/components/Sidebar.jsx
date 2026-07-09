import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Settings, 
  PlusCircle, 
  Share2, 
  Moon, 
  Sun,
  ChevronsLeft,
  LogOut,
  X,
  File,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePages } from '../context/PagesContext';

const Sidebar = ({ isOpen, theme, toggleTheme }) => {
  const { user, logout } = useAuth();
  const { pages, addPage, deletePage } = usePages();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('account');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <>
      <aside className={`sidebar ${!isOpen ? 'collapsed' : ''}`}>
        {/* Workspace Header */}
        <div className="sidebar-header" style={{ marginTop: 12, marginBottom: 16 }}>
          <div style={{ width: 22, height: 22, backgroundColor: '#E03E3E', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: 13 }}>
            S
          </div>
          <span style={{ flex: 1 }}>Salma's Workspace</span>
          <ChevronsLeft size={14} className="text-secondary" style={{ opacity: 0.5 }} />
        </div>

        <div style={{ padding: '0 0px' }}>
          <div className="sidebar-item" onClick={() => setShowSearch(true)}>
            <Search size={16} />
            <span>Search</span>
          </div>
          <div className="sidebar-item" onClick={() => setShowSettings(true)}>
            <Settings size={16} />
            <span>Settings</span>
          </div>
          <div className="sidebar-item" onClick={() => {
            const newPage = addPage();
            navigate(`/page/${newPage.id}`);
          }}>
            <PlusCircle size={16} />
            <span>New Page</span>
          </div>
        </div>

        <div style={{ padding: '24px 14px 4px', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
          PRIVATE
        </div>
        
        <div style={{ padding: '0 0px', flex: 1, marginTop: 4 }}>
          {pages.map((p) => (
            <div key={p.id} className="group relative flex items-center">
              <NavLink
                to={p.id === 'getting-started' ? '/' : `/page/${p.id}`}
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                style={{ flex: 1, minWidth: 0 }}
              >
                <File size={16} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title || 'Untitled'}</span>
              </NavLink>
              {p.id !== 'getting-started' && (
                <button
                  className="opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (window.confirm(`Delete "${p.title || 'Untitled'}"? This cannot be undone.`)) {
                      const wasActive = window.location.pathname === `/page/${p.id}`;
                      deletePage(p.id);
                      if (wasActive) navigate('/');
                    }
                  }}
                  title="Delete page"
                  style={{ position: 'absolute', right: 8, background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          <NavLink to="/canvas" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <Share2 size={16} />
            <span>Workflow Automation</span>
          </NavLink>
        </div>

        {/* User Profile / Footer */}
        <div style={{ padding: '16px 14px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: 'var(--accent-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>
                {user.avatar}
              </div>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                {user.name}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="sidebar-item" onClick={toggleTheme} style={{ padding: 0, minHeight: 'auto', width: 'auto' }}>
              {theme === 'dark' ? (
                <><Sun size={14} /> <span>Light Mode</span></>
              ) : (
                <><Moon size={14} /> <span>Dark Mode</span></>
              )}
            </div>
            
            <button 
              onClick={logout}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12 }}
              title="Log out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Settings Modal */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="animate-fade-in" style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 8, width: 600, height: 400, display: 'flex', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ width: 200, backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid var(--border-color)', padding: '16px 0' }}>
              <div style={{ padding: '0 16px', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, letterSpacing: '0.5px' }}>ACCOUNT</div>
              <div className={`sidebar-item ${activeTab === 'account' ? 'active' : ''}`} onClick={() => setActiveTab('account')} style={{ margin: '0 8px', borderRadius: 4 }}>My account</div>
              <div className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')} style={{ margin: '0 8px', borderRadius: 4 }}>My settings</div>
              <div style={{ padding: '16px 16px 8px', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>WORKSPACE</div>
              <div className={`sidebar-item ${activeTab === 'workspace' ? 'active' : ''}`} onClick={() => setActiveTab('workspace')} style={{ margin: '0 8px', borderRadius: 4 }}>Settings</div>
              <div className={`sidebar-item ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')} style={{ margin: '0 8px', borderRadius: 4 }}>Members</div>
            </div>
            <div style={{ flex: 1, padding: 32, position: 'relative' }}>
              <button onClick={() => setShowSettings(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
              
              {activeTab === 'account' && (
                <>
                  <h2 style={{ fontSize: 18, marginBottom: 24, borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>My account</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'var(--accent-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 600 }}>
                      {user?.avatar}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{user?.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{user?.email}</div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Preferred Name</label>
                    <input type="text" defaultValue={user?.name} style={{ width: '100%', padding: '8px 12px', backgroundColor: 'var(--sidebar-bg)', border: '1px solid var(--border-color)', borderRadius: 4, color: 'var(--text-primary)', outline: 'none' }} />
                  </div>
                </>
              )}

              {activeTab !== 'account' && (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  This section is available in the Pro plan.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {showSearch && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '10vh' }}>
          <div className="animate-fade-in" style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 8, width: 600, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <Search size={20} className="text-secondary" style={{ marginRight: 12 }} />
              <input 
                autoFocus
                type="text" 
                placeholder="Search Salma's Workspace..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 18, outline: 'none' }} 
              />
              <button onClick={() => setShowSearch(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>Esc</button>
            </div>
            <div style={{ padding: '8px 0', maxHeight: 400, overflowY: 'auto' }}>
              {pages.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase())).map((p) => (
                <div 
                  key={p.id} 
                  className="sidebar-item" 
                  style={{ padding: '12px 24px', margin: '4px 8px', borderRadius: 6 }}
                  onClick={() => {
                    navigate(p.id === 'getting-started' ? '/' : `/page/${p.id}`);
                    setShowSearch(false);
                    setSearchQuery('');
                  }}
                >
                  <File size={16} />
                  <span>{p.title || 'Untitled'}</span>
                </div>
              ))}
              <div 
                className="sidebar-item" 
                style={{ padding: '12px 24px', margin: '4px 8px', borderRadius: 6 }}
                onClick={() => {
                  navigate('/canvas');
                  setShowSearch(false);
                  setSearchQuery('');
                }}
              >
                <Share2 size={16} />
                <span>Workflow Automation</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
