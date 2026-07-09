import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Canvas from './components/Canvas';
import { Menu } from 'lucide-react';

function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState('dark');

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <Router>
      <div className="flex h-full w-full">
        <Sidebar isOpen={isSidebarOpen} theme={theme} toggleTheme={toggleTheme} />
        
        <main className="main-content">
          {!isSidebarOpen && (
            <button className="toggle-sidebar" onClick={toggleSidebar}>
              <Menu size={20} />
            </button>
          )}
          
          <Routes>
            <Route path="/" element={<Editor toggleSidebar={isSidebarOpen ? toggleSidebar : undefined} />} />
            <Route path="/canvas" element={<Canvas toggleSidebar={isSidebarOpen ? toggleSidebar : undefined} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
