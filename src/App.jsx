import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Canvas from './components/Canvas';
import Login from './components/Login';
import ErrorBoundary from './components/ErrorBoundary';
import { WorkflowProvider } from './context/WorkflowContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PagesProvider } from './context/PagesContext';
import { Menu } from 'lucide-react';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Loading...</div>;
  }
  
  if (!user) {
    return <Login />;
  }
  
  return children;
};

const AppContent = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return (
    <ProtectedRoute>
      <div className="flex h-full w-full">
        <Sidebar isOpen={sidebarOpen} theme={theme} toggleTheme={toggleTheme} />
        
        <main className="main-content">
          <button 
            className="toggle-sidebar" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ opacity: sidebarOpen ? 0 : 1 }}
          >
            <Menu size={20} />
          </button>

          <Routes>
            <Route path="/" element={<Editor toggleSidebar={sidebarOpen} />} />
            <Route path="/page/:id" element={<Editor toggleSidebar={sidebarOpen} />} />
            <Route path="/canvas" element={<Canvas title="Workflow Automation" toggleSidebar={sidebarOpen} />} />
            <Route path="/canvas/:workflowId" element={<Canvas title="Workflow Automation" toggleSidebar={sidebarOpen} />} />
          </Routes>
        </main>
      </div>
    </ProtectedRoute>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PagesProvider>
          <WorkflowProvider>
            <Router>
              <AppContent />
            </Router>
          </WorkflowProvider>
        </PagesProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
