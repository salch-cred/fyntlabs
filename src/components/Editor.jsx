import React, { useState, useEffect, useRef } from 'react';
import { 
  MoreHorizontal, 
  Star, 
  Clock, 
  MessageSquare,
  PlusCircle, 
  FileText, 
  Heading1,
  Heading2,
  List,
  Code,
  Play,
  Wand2,
  Cpu,
  RefreshCw,
  Share2
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useWorkflow } from '../context/WorkflowContext';
import { usePages } from '../context/PagesContext';
import Canvas from './Canvas'; // We will render this for the portal
import SortableItem from './SortableItem';

const Editor = ({ toggleSidebar }) => {
  const { id } = useParams();
  const pageId = id || 'getting-started';
  const { updatePageTitle } = usePages();
  const { addNode } = useWorkflow();
  const [title, setTitle] = useState("Getting Started");
  const [blocks, setBlocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [slashMenu, setSlashMenu] = useState({ show: false, x: 0, y: 0, blockId: null });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Reset state when pageId changes
  useEffect(() => {
    setIsLoading(true);
    setBlocks([]);
    setTitle("Untitled");
  }, [pageId]);

  // Fetch document
  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/documents/${pageId}`);
        const data = await response.json();
        
        if (data.title) {
          setTitle(data.title);
        } else if (pageId === 'getting-started') {
          setTitle("Getting Started");
        }
        
        if (data.blocks && data.blocks.length > 0) {
          setBlocks(data.blocks);
        } else {
          setBlocks([{ id: 'b1', type: 'text', content: '' }]);
        }
      } catch (error) {
        console.error("Failed to load document:", error);
        setBlocks([{ id: 'b1', type: 'text', content: '' }]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoc();
  }, [pageId]);

  // Save document
  useEffect(() => {
    if (isLoading) return;
    
    // Auto-save debounce
    const timer = setTimeout(async () => {
      try {
        await fetch(`http://localhost:8000/api/documents/${pageId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title,
            blocks: blocks
          })
        });
      } catch (error) {
        console.error("Failed to save document:", error);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [title, blocks, isLoading, pageId]);

  // Sync title with PagesContext
  useEffect(() => {
    if (!isLoading && title) {
      updatePageTitle(pageId, title);
    }
  }, [title, pageId, isLoading]);
  
  // Ref to prevent duplicate node creation on rapid re-renders
  const lastProcessedText = useRef({});

  const handleInput = (blockId, e) => {
    const value = e.currentTarget.textContent;
    const lowerValue = value.toLowerCase();

    // Check for Slash Command
    if (value.endsWith('/')) {
      const rect = e.currentTarget.getBoundingClientRect();
      setSlashMenu({
        show: true,
        x: rect.left,
        y: rect.bottom,
        blockId
      });
    } else {
      if (slashMenu.show) setSlashMenu({ show: false, x: 0, y: 0, blockId: null });
    }

    setBlocks(blocks.map(b => b.id === blockId ? { ...b, content: value } : b));

    // Agent Node Generation (Existing V1 logic)
    if (lowerValue.includes('/workflow') && !blocks.find(b => b.id === blockId).type === 'canvas') {
        setBlocks(blocks.map(b => b.id === blockId ? { ...b, type: 'canvas', content: '' } : b));
        return;
    }

    if (lowerValue.includes('extract') && lastProcessedText.current[blockId] !== 'extract') {
      lastProcessedText.current[blockId] = 'extract';
      addNode('extractNode', 'Extract Data', 'Auto-generated from editor');
    } else if (lowerValue.includes('ai') && lastProcessedText.current[blockId] !== 'ai') {
      lastProcessedText.current[blockId] = 'ai';
      addNode('aiNode', 'AI Analysis', 'Auto-generated from editor');
    } else if (lowerValue.includes('ui') && lastProcessedText.current[blockId] !== 'ui') {
      lastProcessedText.current[blockId] = 'ui';
      addNode('uiNode', 'Interactive Form', 'Auto-generated from editor');
    } else if (lowerValue.includes('agent') && lastProcessedText.current[blockId] !== 'agent') {
      lastProcessedText.current[blockId] = 'agent';
      addNode('agentNode', 'Autonomous Agent', 'Auto-generated from editor');
    }
  };

  const applyFormatting = (formatType) => {
    if (!slashMenu.blockId) return;
    
    setBlocks(blocks.map(b => {
      if (b.id === slashMenu.blockId) {
        // Strip the trailing slash
        const newContent = b.content.replace(/\/$/, '');
        return { ...b, type: formatType, content: newContent, output: '' };
      }
      return b;
    }));
    setSlashMenu({ show: false, x: 0, y: 0, blockId: null });
  };

  const handleRunCode = async (blockId, codeContent) => {
    setBlocks(blocks.map(b => b.id === blockId ? { ...b, output: 'Running...' } : b));
    try {
      const response = await fetch('http://localhost:8000/api/execute-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeContent })
      });
      const data = await response.json();
      const isError = data.output.includes("Error") || data.output.includes("Traceback");
      setBlocks(blocks.map(b => b.id === blockId ? { ...b, output: data.output, isError } : b));
    } catch (err) {
      setBlocks(blocks.map(b => b.id === blockId ? { ...b, output: 'Error connecting to backend.', isError: true } : b));
    }
  };

  const handleAutoFix = async (blockId, currentCode, errorOutput) => {
    setBlocks(blocks.map(b => b.id === blockId ? { ...b, output: 'AI is analyzing the error and fixing the code...' } : b));
    try {
      const response = await fetch('http://localhost:8000/api/auto-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: currentCode, error: errorOutput })
      });
      const data = await response.json();
      if (data.status === 'success') {
        // Update the code content and run it again automatically
        setBlocks(blocks.map(b => b.id === blockId ? { ...b, content: data.fixed_code, output: 'Fix applied! Re-running...', isError: false } : b));
        
        // Slight delay for effect, then run
        setTimeout(() => {
          handleRunCode(blockId, data.fixed_code);
        }, 1000);
      }
    } catch (err) {
      setBlocks(blocks.map(b => b.id === blockId ? { ...b, output: 'Failed to auto-fix.' } : b));
    }
  };

  const handleGenerateWorkflow = async () => {
    // Combine all text blocks
    const fullText = blocks.map(b => b.content).join("\n");
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/generate-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fullText })
      });
      const data = await response.json();
      
      if (data.status === 'success') {
        // We will append a Canvas Portal at the bottom with this generated data!
        // To properly do this, we'd ideally load this into the WorkflowContext.
        // But since we are creating an inline canvas, let's just create a new block type "canvas".
        const newBlocks = [...blocks, { id: `b${Date.now()}`, type: 'canvas', content: 'Generated from document' }];
        setBlocks(newBlocks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div style={{ padding: 40, color: 'var(--text-secondary)' }}>Loading Workspace...</div>;

  return (
    <div className="h-full w-full flex-col relative" style={{ overflowY: 'auto' }}>
      <div className="top-bar">
        <div className="flex items-center gap-2">
          <span style={{ marginLeft: toggleSidebar ? 32 : 0, color: 'var(--text-secondary)', fontSize: 14 }}>
            Salma's Workspace / {title}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleGenerateWorkflow}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#10b981', color: 'white', padding: '6px 12px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}
          >
            <Wand2 size={14} /> AI: Generate Workflow
          </button>
          <span className="text-secondary" style={{ fontSize: 12 }}>Edited just now</span>
          <div className="icon-btn" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, width: 'auto', padding: '0 8px' }}>
            <Share2 size={14} /> Share
          </div>
          <div className="icon-btn"><MessageSquare size={16} /></div>
          <div className="icon-btn"><Star size={16} /></div>
          <div className="icon-btn"><MoreHorizontal size={16} /></div>
        </div>
      </div>

      <div className="editor-container animate-fade-in">
        <img 
          src="https://images.unsplash.com/photo-1707343843437-caacff5cfa74?q=80&w=2940&auto=format&fit=crop" 
          alt="Cover" 
          className="cover-image"
          style={{ borderRadius: 8, marginBottom: 32 }}
        />
        
        <div className="page-icon">🚀</div>
        
        <input 
          type="text" 
          className="page-title" 
          placeholder="Untitled" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        
        <div className="editor-content pb-32">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={blocks.map(b => b.id)}
              strategy={verticalListSortingStrategy}
            >
              {blocks.map((block, index) => {
                if (block.type === 'canvas') {
                  return (
                    <div key={block.id} style={{ marginBottom: 24, position: 'relative' }}>
                      <div style={{ position: 'absolute', top: -12, left: 0, zIndex: 10, background: '#1e1e1e', padding: '4px 12px', border: '1px solid #333', borderRadius: '16px', fontSize: 11, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Cpu size={12} /> Canvas Portal
                      </div>
                      <div style={{ height: 400, border: '1px solid #3d3d3d', borderRadius: 8, overflow: 'hidden' }}>
                        <Canvas />
                      </div>
                    </div>
                  );
                }

                return (
                  <SortableItem key={block.id} id={block.id}>
                    <div className="flex group relative w-full items-start">
                      <div className="opacity-0 group-hover:opacity-100 flex items-center pr-2 cursor-pointer text-gray-500 pt-1">
                        <PlusCircle size={16} onClick={() => {
                      const newBlocks = [...blocks];
                      newBlocks.splice(index + 1, 0, { id: `b${Date.now()}`, type: 'text', content: '' });
                      setBlocks(newBlocks);
                    }} />
                  </div>
                  
                  {block.type === 'code' && (
                    <button 
                      onClick={() => handleRunCode(block.id, block.content)}
                      style={{ position: 'absolute', right: 8, top: 4, zIndex: 10, background: '#2d2d2d', color: '#89d185', border: '1px solid #3d3d3d', borderRadius: 4, padding: '2px 8px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Play size={10} /> Run Code
                    </button>
                  )}

                  <div 
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => handleInput(block.id, e)}
                    className="flex-1 outline-none relative"
                    style={{ 
                      minHeight: '24px',
                      padding: '4px 0',
                      fontSize: block.type === 'h1' ? '2em' : block.type === 'h2' ? '1.5em' : '1em',
                      fontWeight: block.type === 'h1' || block.type === 'h2' ? 'bold' : 'normal',
                      fontFamily: block.type === 'code' ? 'monospace' : 'inherit',
                      backgroundColor: block.type === 'code' ? '#1e1e1e' : 'transparent',
                      borderRadius: block.type === 'code' ? '4px' : '0',
                      padding: block.type === 'code' ? '12px 12px 12px 12px' : '4px 0',
                      display: block.type === 'list' ? 'list-item' : 'block',
                      listStyleType: block.type === 'list' ? 'disc' : 'none',
                      marginLeft: block.type === 'list' ? '20px' : '0'
                    }}
                  >
                    {block.content}
                  </div>
                </div>
                {block.type === 'code' && block.output && (
                  <div style={{ marginLeft: 28, marginTop: 4, padding: 8, backgroundColor: '#141414', borderLeft: `2px solid ${block.isError ? '#E03E3E' : '#89d185'}`, fontFamily: 'monospace', fontSize: 12, color: '#d4d4d4', whiteSpace: 'pre-wrap', position: 'relative' }}>
                    {block.output}
                    {block.isError && (
                      <button 
                        onClick={() => handleAutoFix(block.id, block.content, block.output)}
                        style={{ position: 'absolute', right: 8, top: 8, background: '#E03E3E', color: 'white', border: 'none', borderRadius: 4, padding: '4px 8px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <RefreshCw size={12} /> Auto-Fix with AI
                      </button>
                    )}
                  </div>
                )}
              </SortableItem>
            );
          })}
            </SortableContext>
          </DndContext>
        </div>

      {slashMenu.show && (
        <div style={{
          position: 'fixed',
          top: slashMenu.y,
          left: slashMenu.x,
          backgroundColor: '#252526',
          border: '1px solid var(--border-color)',
          borderRadius: 6,
          padding: 8,
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          width: 200
        }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 8, paddingLeft: 8 }}>BASIC BLOCKS</div>
          <button onClick={() => applyFormatting('text')} className="slash-menu-item"><FileText size={14} /> Text</button>
          <button onClick={() => applyFormatting('h1')} className="slash-menu-item"><Heading1 size={14} /> Heading 1</button>
          <button onClick={() => applyFormatting('h2')} className="slash-menu-item"><Heading2 size={14} /> Heading 2</button>
          <button onClick={() => applyFormatting('list')} className="slash-menu-item"><List size={14} /> Bulleted List</button>
          <button onClick={() => applyFormatting('code')} className="slash-menu-item"><Code size={14} /> Code Block</button>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 8, marginTop: 12, paddingLeft: 8 }}>ADVANCED</div>
          <button onClick={() => applyFormatting('canvas')} className="slash-menu-item"><Cpu size={14} /> Canvas Portal</button>
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        .slash-menu-item {
          background: transparent;
          border: none;
          color: var(--text-primary);
          padding: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          border-radius: 4px;
          text-align: left;
        }
        .slash-menu-item:hover {
          background-color: #37373d;
        }
      `}} />
      </div>
    </div>
  );
};

export default Editor;
