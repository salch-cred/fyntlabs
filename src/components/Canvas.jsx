import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Bot, FileText, Send, Play, Layout, RefreshCw, CheckCircle, AlertCircle, BrainCircuit, TerminalSquare } from 'lucide-react';
import { useWorkflow } from '../context/WorkflowContext';

// Base Custom Node wrapper
const BaseNode = ({ icon: Icon, title, children, status }) => {
  let borderColor = 'var(--node-border)';
  if (status === 'error') borderColor = '#E03E3E';
  if (status === 'success') borderColor = '#0F7B6C';
  if (status === 'healing') borderColor = '#D9730D';

  return (
    <div className="gumloop-node" style={{ borderColor, transition: 'border-color 0.3s ease' }}>
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <div className="gumloop-node-header justify-between">
        <div className="flex items-center gap-2">
          <div style={{ backgroundColor: 'var(--accent-color)', padding: 6, borderRadius: 6, display: 'flex' }}>
            <Icon size={16} color="white" />
          </div>
          <span>{title}</span>
        </div>
        {status === 'error' && <AlertCircle size={14} color="#E03E3E" />}
        {status === 'success' && <CheckCircle size={14} color="#0F7B6C" />}
        {status === 'healing' && <RefreshCw size={14} color="#D9730D" className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />}
      </div>
      <div className="gumloop-node-content">
        {children}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// Standard text nodes
const TriggerNode = (props) => <BaseNode icon={Play} title={props.data.title || "Manual Trigger"} {...props}>{props.data.description}</BaseNode>;
const ExtractNode = (props) => <BaseNode icon={FileText} title={props.data.title || "Extract Data"} {...props}>{props.data.description}</BaseNode>;
const OutputNode = (props) => <BaseNode icon={Send} title={props.data.title || "Send Email"} {...props}>{props.data.description}</BaseNode>;

// Generative UI Node
const UINode = (props) => (
  <BaseNode icon={Layout} title={props.data.title || "Interactive UI"} {...props}>
    <div style={{ padding: '8px 0', borderTop: '1px solid var(--border-color)', marginTop: 8 }}>
      <p style={{ marginBottom: 8, fontSize: 12 }}>Generated Form:</p>
      <input type="text" placeholder="Enter feedback..." style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', marginBottom: 8, fontSize: 12 }} />
      <button style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-color)', border: 'none', padding: '6px 12px', borderRadius: 4, width: '100%', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
        Submit
      </button>
    </div>
  </BaseNode>
);

// Self-Healing AI Node
const AINode = (props) => {
  const { updateNodeData } = useWorkflow();
  const { id, data } = props;

  const handleRun = () => {
    updateNodeData(id, d => ({ ...d, status: 'error', description: 'Error: API Rate Limit Exceeded' }));
    setTimeout(() => {
      updateNodeData(id, d => ({ ...d, status: 'healing', description: 'Self-Healing: Adjusting prompt and retrying...' }));
      setTimeout(() => {
        updateNodeData(id, d => ({ ...d, status: 'success', description: 'Success: Summarized 14 pages of text.' }));
      }, 2000);
    }, 1500);
  };

  return (
    <BaseNode icon={Bot} title={props.data.title || "AI Analysis"} status={data.status} {...props}>
      <div style={{ marginBottom: 12 }}>{data.description}</div>
      <button 
        onClick={handleRun}
        style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' }}
      >
        <Play size={12} /> Test Execution
      </button>
    </BaseNode>
  );
};

// NEW: n8n Agent Node
const AgentNode = (props) => {
  const { data } = props;
  
  return (
    <BaseNode icon={BrainCircuit} title={props.data.title || "Autonomous Agent"} status={data.status} {...props}>
      <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
        This agent will autonomously decide which connected tools to run based on the prompt.
      </div>
      <div style={{ padding: '8px', backgroundColor: '#1a1a1a', borderRadius: 4, border: '1px solid var(--border-color)', fontSize: 11, fontFamily: 'monospace' }}>
        {data.reasoning ? (
          data.reasoning.map((r, i) => <div key={i} style={{ color: r.startsWith('Agent:') ? '#cca700' : '#89d185', marginBottom: 4 }}>{r}</div>)
        ) : (
          <span style={{ opacity: 0.5 }}>Waiting for execution...</span>
        )}
      </div>
    </BaseNode>
  );
};

const nodeTypes = {
  triggerNode: TriggerNode,
  extractNode: ExtractNode,
  aiNode: AINode,
  outputNode: OutputNode,
  uiNode: UINode,
  agentNode: AgentNode
};

const Canvas = ({ toggleSidebar }) => {
  const { 
    nodes, edges, actualNodes, actualEdges, 
    onNodesChange, onEdgesChange, onConnect,
    history, historyIndex, setHistoryIndex, isTimeTraveling
  } = useWorkflow();

  const [isExecuting, setIsExecuting] = useState(false);
  
  // Terminal State
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState(['$ ']);
  const [terminalInput, setTerminalInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalOutput, showTerminal]);

  const handleCommand = (e) => {
    if (e.key === 'Enter') {
      const cmd = terminalInput.trim();
      let newOutput = [...terminalOutput];
      newOutput[newOutput.length - 1] += cmd;
      
      if (cmd === 'npm run dev') {
        newOutput.push('> nextjs-portfolio@0.1.0 dev');
        newOutput.push('> next dev');
        newOutput.push('ready - started server on 0.0.0.0:3000, url: http://localhost:3000');
        newOutput.push('event - compiled client and server successfully in 1254 ms');
      } else if (cmd === 'clear') {
        newOutput = [];
      } else if (cmd !== '') {
        newOutput.push(`bash: ${cmd}: command not found`);
      }
      
      newOutput.push('$ ');
      setTerminalOutput(newOutput);
      setTerminalInput('');
    }
  };

  const handleRunWorkflow = async () => {
    setIsExecuting(true);
    
    // Find agent node to show thinking state
    const agentNode = actualNodes.find(n => n.type === 'agentNode');
    if (agentNode) {
      updateNodeData(agentNode.id, d => ({ ...d, status: 'healing', reasoning: ['Agent: Thinking...'] }));
    }

    try {
      const response = await fetch('http://localhost:8000/api/execute-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: actualNodes, edges: actualEdges })
      });
      
      const result = await response.json();
      
      if (result.status === 'success' && agentNode) {
        updateNodeData(agentNode.id, d => ({ 
          ...d, 
          status: 'success', 
          reasoning: result.agent_reasoning 
        }));
        
        // Highlight executed nodes
        result.nodes_executed.forEach(type => {
          const node = actualNodes.find(n => n.type === type);
          if (node) updateNodeData(node.id, d => ({ ...d, status: 'success' }));
        });
      } else if (result.status === 'error') {
        alert(result.message);
        if (agentNode) updateNodeData(agentNode.id, d => ({ ...d, status: 'error' }));
      }
    } catch (error) {
      alert("Failed to connect to FastAPI backend. Is it running on port 8000?");
      if (agentNode) updateNodeData(agentNode.id, d => ({ ...d, status: 'error' }));
    }
    
    setIsExecuting(false);
  };

  return (
    <div className="h-full w-full flex-col relative">
      <div className="top-bar">
        <div className="flex items-center gap-2">
          <span style={{ marginLeft: toggleSidebar ? 32 : 0, color: 'var(--text-secondary)', fontSize: 14 }}>
            Salma's Workspace / Workflow Automation
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowTerminal(!showTerminal)}
            style={{ 
              backgroundColor: 'transparent', 
              color: 'var(--text-primary)', 
              border: '1px solid var(--border-color)', 
              padding: '6px 12px', 
              borderRadius: 6, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <TerminalSquare size={14} />
            Terminal
          </button>
          
          <button 
            onClick={handleRunWorkflow}
            disabled={isExecuting}
            style={{ 
              backgroundColor: 'var(--accent-color)', 
              color: 'white', 
              border: 'none', 
              padding: '6px 16px', 
              borderRadius: 6, 
              fontWeight: 500,
              cursor: isExecuting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              opacity: isExecuting ? 0.7 : 1
            }}
          >
            {isExecuting ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
            {isExecuting ? 'Executing Agent...' : 'Run Workflow'}
          </button>
        </div>
      </div>

      {/* Time Travel Slider */}
      <div style={{ position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 10, backgroundColor: 'var(--sidebar-bg)', padding: '12px 24px', borderRadius: 24, boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 12, width: 400 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Rewind Time</span>
        <input 
          type="range" 
          min={0} 
          max={history.length - 1} 
          value={historyIndex} 
          onChange={(e) => setHistoryIndex(parseInt(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--accent-color)' }}
        />
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          Step {historyIndex + 1}/{history.length}
        </span>
      </div>
      
      <div style={{ flex: 1, filter: isTimeTraveling ? 'grayscale(0.5) sepia(0.2)' : 'none', transition: 'filter 0.3s ease' }} className="animate-fade-in">
        <ReactFlow
          nodes={isTimeTraveling ? nodes : actualNodes}
          edges={isTimeTraveling ? edges : actualEdges}
          onNodesChange={isTimeTraveling ? undefined : onNodesChange}
          onEdgesChange={isTimeTraveling ? undefined : onEdgesChange}
          onConnect={isTimeTraveling ? undefined : onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-transparent"
        >
          <Controls />
          <MiniMap 
            nodeColor={() => 'var(--node-border)'}
            maskColor="rgba(0, 0, 0, 0.1)"
            style={{ backgroundColor: 'var(--bg-color)' }}
          />
          <Background variant="dots" gap={12} size={1} color="var(--border-color)" />
        </ReactFlow>
      </div>

      {/* Integrated Terminal Panel */}
      {showTerminal && (
        <div style={{ height: 250, borderTop: '1px solid var(--border-color)', backgroundColor: '#1e1e1e', display: 'flex', flexDirection: 'column', zIndex: 20 }}>
          <div style={{ height: 35, display: 'flex', alignItems: 'center', gap: 16, padding: '0 16px', backgroundColor: '#252526', fontSize: 12, color: '#d4d4d4' }}>
            <span style={{ borderBottom: '1px solid white', paddingBottom: 8, marginTop: 8 }}>TERMINAL</span>
            <button onClick={() => setShowTerminal(false)} style={{ background: 'transparent', border: 'none', color: '#d4d4d4', cursor: 'pointer', marginLeft: 'auto' }}>✕</button>
          </div>
          <div style={{ flex: 1, padding: 12, fontFamily: 'monospace', fontSize: 13, overflowY: 'auto', color: '#d4d4d4' }}>
            {terminalOutput.map((line, i) => (
              <div key={i} style={{ marginBottom: 4 }}>
                {i === terminalOutput.length - 1 ? (
                  <div style={{ display: 'flex' }}>
                    <span style={{ color: '#89d185', marginRight: 8 }}>{line}</span>
                    <input 
                      type="text"
                      value={terminalInput}
                      onChange={(e) => setTerminalInput(e.target.value)}
                      onKeyDown={handleCommand}
                      style={{ flex: 1, background: 'transparent', border: 'none', color: '#d4d4d4', outline: 'none', fontFamily: 'monospace' }}
                      autoFocus
                    />
                  </div>
                ) : (
                  <span style={{ color: line.startsWith('>') || line.startsWith('ready') || line.startsWith('event') ? '#cca700' : '#d4d4d4' }}>
                    {line}
                  </span>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;
