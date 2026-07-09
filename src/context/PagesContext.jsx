import React, { createContext, useContext, useState, useEffect } from 'react';

const PagesContext = createContext();

export const PagesProvider = ({ children }) => {
  const [pages, setPages] = useState(() => {
    const saved = localStorage.getItem('notion_gumloop_pages');
    if (saved) return JSON.parse(saved);
    return [{ id: 'getting-started', title: 'Getting Started' }];
  });

  useEffect(() => {
    localStorage.setItem('notion_gumloop_pages', JSON.stringify(pages));
  }, [pages]);

  const addPage = () => {
    const newPage = { id: `page-${Date.now()}`, title: 'Untitled' };
    setPages([...pages, newPage]);
    return newPage;
  };

  const updatePageTitle = (id, title) => {
    setPages(pages.map(p => p.id === id ? { ...p, title } : p));
  };

  return (
    <PagesContext.Provider value={{ pages, addPage, updatePageTitle }}>
      {children}
    </PagesContext.Provider>
  );
};

export const usePages = () => useContext(PagesContext);
