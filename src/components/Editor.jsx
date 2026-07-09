import React, { useState, useEffect, useRef } from 'react';
import { MoreHorizontal, Star, Clock, MessageSquare } from 'lucide-react';
import { useWorkflow } from '../context/WorkflowContext';
import Canvas from './Canvas'; // We will render this for the portal

const Editor = ({ toggleSidebar }) => {
  const { addNode } = useWorkflow();
  const [title, setTitle] = useState("Getting Started");
  const [blocks, setBlocks] = useState([
    { id: 'b1', type: 'text', content: "Welcome to your new workspace!" },
    { id: 'b2', type: 'text', content: "This is a rich text editor built to feel like Notion." },
    { id: 'b3', type: 'text', content: "Try typing 'extract', 'ai', 'ui', or 'agent' below to auto-generate nodes in the canvas!" },
    { id: 'b4', type: 'text', content: "Or type '/workflow' to embed a Canvas Portal." },
    { id: 'b5', type: 'text', content: "" }
  ]);
  
  // Ref to prevent duplicate node creation on rapid re-renders
  const lastProcessedText = useRef({});

  const handleBlockChange = (index, value) => {
    const newBlocks = [...blocks];
    newBlocks[index].content = value;
    setBlocks(newBlocks);

    // LIVE TEXT-TO-NODE SYNC LOGIC
    const lowerValue = value.toLowerCase();
    const blockId = newBlocks[index].id;
    
    if (lowerValue.includes('/workflow') && newBlocks[index].type === 'text') {
      newBlocks[index].type = 'canvas';
      newBlocks[index].content = '';
      setBlocks([...newBlocks]);
      return;
    }

    // Only add node once per specific keyword detection in this block
    if (lowerValue.includes('extract') && lastProcessedText.current[blockId] !== 'extract') {
      lastProcessedText.current[blockId] = 'extract';
      addNode('extractNode', 'Extract PDF', 'Auto-generated from editor');
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

  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, { id: 'b' + Date.now(), type: 'text', content: '' });
      setBlocks(newBlocks);
    }
    if (e.key === 'Backspace' && blocks[index].content === "" && index > 0) {
      e.preventDefault();
      const newBlocks = [...blocks];
      newBlocks.splice(index, 1);
      setBlocks(newBlocks);
    }
  };

  return (
    <div className="h-full w-full flex-col" style={{ overflowY: 'auto' }}>
      <div className="top-bar">
        <div className="flex items-center gap-2">
          <span style={{ marginLeft: toggleSidebar ? 32 : 0, color: 'var(--text-secondary)', fontSize: 14 }}>
            Salma's Workspace / Getting Started
          </span>
        </div>
        <div className="flex items-center gap-4 text-secondary" style={{ color: 'var(--text-secondary)' }}>
          <Clock size={18} style={{ cursor: 'pointer' }} />
          <MessageSquare size={18} style={{ cursor: 'pointer' }} />
          <Star size={18} style={{ cursor: 'pointer' }} />
          <MoreHorizontal size={18} style={{ cursor: 'pointer' }} />
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
        
        <div className="editor-content">
          {blocks.map((block, index) => {
            if (block.type === 'canvas') {
              return (
                <div key={block.id} style={{ height: 400, border: '1px solid var(--border-color)', borderRadius: 8, margin: '16px 0', overflow: 'hidden' }}>
                  <Canvas />
                </div>
              );
            }

            return (
              <div
                key={block.id}
                className="editor-block"
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => handleBlockChange(index, e.currentTarget.innerText)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                data-placeholder={index === blocks.length - 1 ? "Type '/' for commands" : ""}
                style={{ outline: 'none' }}
              >
                {/* Need to ensure content is only set initially to avoid cursor jumping */}
                {block.content}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Editor;
