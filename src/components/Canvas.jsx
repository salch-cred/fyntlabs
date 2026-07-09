import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Bot, FileText, Send, Play, Layout, RefreshCw, CheckCircle, AlertCircle,
  BrainCircuit, TerminalSquare, GitBranch, Clock, Trash2, Plus, ChevronDown,
  Pencil, X, Check
} from 'lucide-react';
import { useWorkflow } from '../context/WorkflowContext';

// Base Custom Node wrapper
const BaseNode = ({ icon: Icon, title, children, status, selected }) => {
  let borderColor = 'var(--node-border)';
  if (status === 'error') borderColor = '#E03E3E';
  if (status === 'success') borderColor = '#0F7B6C';
  if (status === 'healing') borderColor = '#D9730D';
  if (selected) borderColor = 'var(--accent-color)';

  return (
    <div className="gumloop-node" style={{ borderColor, boxShadow: selected ? '0 0 0 2px var(--accent-color)' : 'none', transition: 'border-color 0.3s ease' }}>
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
        {status === 'healing' && <RefreshCw size={14} color="#D9730D" className="animate-spin" />}
      </div>
      <div className="gumloop-node-content">
        {children}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    </div>
  );
};

// Standard text nodes
const TriggerNode = (props) => (
  <BaseNode icon={Play} title={props.data.title || "Manual Trigger"} {...props}>
    <div style={{ marginBottom: 8 }}>{props.data.description}</div>
    <div style={{ padding: 6, backgroundColor: '#1a1a1a', borderRadius: 4, border: '1px solid #333', fontSize: 10 }}>
      <div style={{ color: '#888', marginBottom: 2 }}>Webhook URL:</div>
      <div style={{ fontFamily: 'monospace', color: '#89d185' }}>POST http://localhost:8000/api/webhook/wf-1</div>
    </div>
  </BaseNode>
);
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

// Condition / Branch Node — routes execution down one of two paths
const ConditionNode = (props) => (
  <BaseNode icon={GitBranch} title={props.data.title || "Condition"} {...props}>
    <div style={{ marginBottom: 8 }}>{props.data.description || 'If the condition is true, continue to the connected branch.'}</div>
    <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
      <span style={{ padding: '2px 8px', borderRadius: 4, backgroundColor: 'rgba(15,123,108,0.15)', color: '#0F7B6C' }}>True</span>
      <span style={{ padding: '2px 8px', borderRadius: 4, backgroundColor: 'rgba(224,62,62,0.15)', color: '#E03E3E' }}>False</span>
    </div>
  </BaseNode>
);

// Delay Node — pauses the workflow before continuing
const DelayNode = (props) => (
  <BaseNode icon={Clock} title={props.data.title || "Delay"} {...props}>
    <div>{props.data.description || 'Wait before running the next step.'}</div>
  </BaseNode>
);

// Self-Healing AI Node
const AINode = (props) => {
  const { updateNodeData } = useWorkflow();
  const { id, data } = props;

  const handleRun = (e) => {
    e.stopPropagation();
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

// n8n-style Agent Node
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
  agentNode: AgentNode,
  conditionNode: ConditionNode,
  delayNode: DelayNode,
};

// Node palette — the set of node types a user can drop onto the canvas,
// mirroring a Gumloop/n8n-style tool panel.
const NODE_PALETTE = [
  { type: 'triggerNode', title: 'Manual Trigger', description: 'Start the workflow manually', icon: Play },
  { type: 'extractNode', title: 'Extract Data', description: 'Pull structured data from a source', icon: FileText },
  { type: 'aiNode', title: 'AI Analysis', description: 'Summarize, classify, or transform text with AI', icon: Bot },
  { type: 'agentNode', title: 'Autonomous Agent', description: 'Let an agent decide which tools to run', icon: BrainCircuit },
  { type: 'conditionNode', title: 'Condition', description: 'Branch the workflow based on a rule', icon: GitBranch },
  { type: 'delayNode', title: 'Delay', description: 'Wait before continuing', icon: Clock },
  { type: 'uiNode', title: 'Interactive UI', description: 'Collect input with a generated form', icon: Layout },
  { type: 'outputNode', title: 'Send Email', description: 'Deliver the result', icon: Send },
];

const Canvas = ({ toggleSidebar }) => {
  const { workflowId: routeWorkflowId } = useParams();
  const navigate = useNavigate();
  const {
    nodes, edges, actualNodes, actualEdges,
    onNodesChange, onEdgesChange, onConnect, updateNodeData,
    addNode, deleteNode, deleteEdge, persistCurrentGraph,
    history, historyIndex, setHistoryIndex, isTimeTraveling,
    currentWorkflowId, workflowList, switchWorkflow, createWorkflow,
    renameWorkflow, deleteWorkflow, isLoadingGraph,
  } = useWorkflow();

  const [isExecuting, setIsExecuting] = useState(false);

  // Terminal State
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState(['$ ']);
  const [terminalInput, setTerminalInput] = useState('');
  const bottomRef = useRef(null);
  const wsRef = useRef(null);

  // Debug Logs State
  const [debugLogs, setDebugLogs] = useState([]);
  const [showDebug, setShowDebug] = useState(false);

  // Node palette + node editor panel
  const [showPalette, setShowPalette] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  // Workflow switcher
  const [showWorkflowMenu, setShowWorkflowMenu] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  // Keep the WorkflowContext's "current workflow" in sync with the URL
  useEffect(() => {
    switchWorkflow(routeWorkflowId);
  }, [routeWorkflowId, switchWorkflow]);

  useEffect(() => {
    setSelectedNodeId(null);
  }, [currentWorkflowId]);

  const selectedNode = actualNodes.find(n => n.id === selectedNodeId) || null;
  const currentWorkflowMeta = workflowList.find(w => w.id === currentWorkflowId);

  // Initialize WebSocket connection when terminal opens
  useEffect(() => {
    if (showTerminal && !wsRef.current) {
      wsRef.current = new WebSocket('ws://localhost:8000/ws/terminal');

      wsRef.current.onmessage = (event) => {
        const data = event.data;
        if (data === "CLEAR_TERMINAL") {
          setTerminalOutput(['$ ']);
        } else {
          setTerminalOutput(prev => {
            const newOutput = [...prev];
            newOutput.splice(newOutput.length - 1, 0, data);
            return newOutput;
          });
        }
      };

      wsRef.current.onclose = () => {
        setTerminalOutput(prev => {
          const newOutput = [...prev];
          newOutput.splice(newOutput.length - 1, 0, "Connection closed.");
          return newOutput;
        });
        wsRef.current = null;
      };
    }

    return () => {};
  }, [showTerminal]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalOutput, showTerminal]);

  const handleCommand = (e) => {
    if (e.key === 'Enter') {
      const cmd = terminalInput.trim();

      setTerminalOutput(prev => {
        const newOutput = [...prev];
        newOutput[newOutput.length - 1] += cmd;
        newOutput.push('$ ');
        return newOutput;
      });

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(cmd);
      } else {
        setTerminalOutput(prev => {
          const newOutput = [...prev];
          newOutput.splice(newOutput.length - 1, 0, "Error: Terminal not connected.");
          return newOutput;
        });
      }

      setTerminalInput('');
    }
  };

  const handleAddNode = (paletteItem) => {
    const position = {
      x: 250 + Math.round((Math.random() - 0.5) * 200),
      y: 80 + Math.round(Math.random() * 300),
    };
    addNode(paletteItem.type, paletteItem.title, paletteItem.description, position);
    setShowPalette(false);
  };

  const handleDeleteSelectedNode = () => {
    if (!selectedNodeId) return;
    deleteNode(selectedNodeId);
    setSelectedNodeId(null);
  };

  const handleRunWorkflow = async () => {
    setIsExecuting(true);

    // Simple topological execution simulation
    const incomingEdges = {};
    actualEdges.forEach(e => {
      if (!incomingEdges[e.target]) incomingEdges[e.target] = [];
      incomingEdges[e.target].push(e);
    });

    const rootNodes = actualNodes.filter(n => !incomingEdges[n.id]);

    if (rootNodes.length === 0) {
      alert("No valid workflow found. Please connect some nodes!");
      setIsExecuting(false);
      return;
    }

    try {
      actualNodes.forEach(n => updateNodeData(n.id, d => ({ ...d, status: undefined })));

      let queue = [...rootNodes];
      const executed = new Set();

      while (queue.length > 0) {
        const current = queue.shift();
        if (executed.has(current.id)) continue;

        updateNodeData(current.id, d => ({ ...d, status: 'healing' }));

        if (current.type === 'agentNode') {
          try {
            const response = await fetch('http://localhost:8000/api/execute-agent', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ nodes: actualNodes, edges: actualEdges })
            });
            const result = await response.json();
            setDebugLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), response: result }]);

            if (result.status === 'success') {
              updateNodeData(current.id, d => ({ ...d, status: 'success', reasoning: result.agent_reasoning }));
            } else {
              updateNodeData(current.id, d => ({ ...d, status: 'error', reasoning: [result.message || 'Agent execution failed.'] }));
            }
          } catch (err) {
            updateNodeData(current.id, d => ({ ...d, status: 'error', reasoning: ['Error: could not reach agent backend.'] }));
          }
        } else if (current.type === 'delayNode') {
          await new Promise(resolve => setTimeout(resolve, 600));
          updateNodeData(current.id, d => ({ ...d, status: 'success' }));
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000));
          updateNodeData(current.id, d => ({ ...d, status: 'success' }));
        }

        executed.add(current.id);

        const childrenEdges = actualEdges.filter(e => e.source === current.id);
        for (const edge of childrenEdges) {
          const targetNode = actualNodes.find(n => n.id === edge.target);
          if (targetNode && !executed.has(targetNode.id)) {
            const targetIncoming = incomingEdges[targetNode.id] || [];
            const allDepsMet = targetIncoming.every(e => executed.has(e.source));
            if (allDepsMet && !queue.includes(targetNode)) {
              queue.push(targetNode);
            }
          }
        }
      }

      setDebugLogs(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        response: { status: 'success', message: `Workflow completed. ${executed.size} node(s) executed.` }
      }]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCreateWorkflow = async () => {
    const name = newWorkflowName.trim() || 'Untitled Workflow';
    const wf = await createWorkflow(name);
    setNewWorkflowName('');
    setShowWorkflowMenu(false);
    navigate(`/canvas/${wf.id}`);
  };

  const handleSelectWorkflow = (id) => {
    setShowWorkflowMenu(false);
    navigate(id === 'default' ? '/canvas' : `/canvas/${id}`);
  };

  const handleDeleteWorkflow = async (e, id) => {
    e.stopPropagation();
    if (id === 'default') return;
    if (!window.confirm('Delete this workflow? This cannot be undone.')) return;
    await deleteWorkflow(id);
    if (currentWorkflowId === id) navigate('/canvas');
  };

  return (
    <div className="h-full w-full flex-col relative">
      <div className="top-bar">
        <div className="flex items-center gap-2" style={{ position: 'relative' }}>
          <span style={{ marginLeft: toggleSidebar ? 32 : 0, color: 'var(--text-secondary)', fontSize: 14 }}>
            Salma's Workspace /
          </span>
          <button
            onClick={() => setShowWorkflowMenu(!showWorkflowMenu)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 14, fontWeight: 500, cursor: 'pointer', padding: '2px 4px', borderRadius: 4 }}
          >
            {currentWorkflowMeta?.name || 'Workflow Automation'}
            <ChevronDown size={14} />
          </button>

          {showWorkflowMenu && (
            <div style={{ position: 'absolute', top: 32, left: 0, zIndex: 100, width: 280, backgroundColor: 'var(--sidebar-bg)', border: '1px solid var(--border-color)', borderRadius: 8, boxShadow: 'var(--shadow-lg)', padding: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', padding: '4px 8px', letterSpacing: '0.5px' }}>WORKFLOWS</div>
              {workflowList.map(w => (
                <div
                  key={w.id}
                  onClick={() => handleSelectWorkflow(w.id)}
                  className="sidebar-item"
                  style={{ borderRadius: 6, justifyContent: 'space-between' }}
                >
                  {renamingId === w.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { renameWorkflow(w.id, renameValue.trim() || w.name); setRenamingId(null); }
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                      style={{ flex: 1, background: 'var(--bg-color)', border: '1px solid var(--accent-color)', borderRadius: 4, color: 'var(--text-primary)', fontSize: 13, padding: '2px 6px' }}
                    />
                  ) : (
                    <span style={{ flex: 1, fontWeight: w.id === currentWorkflowId ? 600 : 400 }}>{w.name}</span>
                  )}
                  <div style={{ display: 'flex', gap: 4 }}>
                    {renamingId === w.id ? (
                      <button onClick={(e) => { e.stopPropagation(); renameWorkflow(w.id, renameValue.trim() || w.name); setRenamingId(null); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 2 }}>
                        <Check size={13} />
                      </button>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); setRenamingId(w.id); setRenameValue(w.name); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 2 }}>
                        <Pencil size={13} />
                      </button>
                    )}
                    {w.id !== 'default' && (
                      <button onClick={(e) => handleDeleteWorkflow(e, w.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 2 }}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 6, marginTop: 8, padding: '4px 4px 0' }}>
                <input
                  value={newWorkflowName}
                  onChange={(e) => setNewWorkflowName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreateWorkflow(); }}
                  placeholder="New workflow name..."
                  style={{ flex: 1, background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 4, color: 'var(--text-primary)', fontSize: 12, padding: '6px 8px' }}
                />
                <button
                  onClick={handleCreateWorkflow}
                  style={{ background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: 4, padding: '0 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowPalette(!showPalette)}
            style={{
              backgroundColor: showPalette ? 'var(--accent-color)' : 'transparent',
              color: showPalette ? 'white' : 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              padding: '6px 12px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Plus size={14} /> Add Node
          </button>

          <button
            onClick={() => setShowDebug(!showDebug)}
            style={{
              backgroundColor: showDebug ? '#2d2d2d' : 'transparent',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              padding: '6px 12px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12
            }}
          >
            Debug Logs
          </button>

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

      {/* Node Palette */}
      {showPalette && (
        <div style={{ position: 'absolute', top: 60, left: 16, zIndex: 15, width: 260, backgroundColor: 'var(--sidebar-bg)', border: '1px solid var(--border-color)', borderRadius: 8, boxShadow: 'var(--shadow-lg)', padding: 8, maxHeight: '70vh', overflowY: 'auto' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', padding: '4px 8px', letterSpacing: '0.5px' }}>ADD A NODE</div>
          {NODE_PALETTE.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.type}
                onClick={() => handleAddNode(item)}
                className="sidebar-item"
                style={{ borderRadius: 6, alignItems: 'flex-start', padding: '8px 8px' }}
              >
                <div style={{ backgroundColor: 'var(--accent-color)', padding: 6, borderRadius: 6, display: 'flex', flexShrink: 0 }}>
                  <Icon size={14} color="white" />
                </div>
                <div>
                  <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500 }}>{item.title}</div>
                  <div style={{ fontSize: 11 }}>{item.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Node Editor Panel */}
      {selectedNode && (
        <div style={{ position: 'absolute', top: 60, right: 16, zIndex: 15, width: 280, backgroundColor: 'var(--sidebar-bg)', border: '1px solid var(--border-color)', borderRadius: 8, boxShadow: 'var(--shadow-lg)', padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>EDIT NODE</span>
            <button onClick={() => setSelectedNodeId(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Title</label>
          <input
            value={selectedNode.data.title || ''}
            onChange={(e) => updateNodeData(selectedNode.id, d => ({ ...d, title: e.target.value }))}
            style={{ width: '100%', padding: '6px 8px', marginBottom: 12, backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 4, color: 'var(--text-primary)', fontSize: 13 }}
          />
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Description</label>
          <textarea
            value={selectedNode.data.description || ''}
            onChange={(e) => updateNodeData(selectedNode.id, d => ({ ...d, description: e.target.value }))}
            rows={3}
            style={{ width: '100%', padding: '6px 8px', marginBottom: 12, backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 4, color: 'var(--text-primary)', fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }}
          />
          <button
            onClick={handleDeleteSelectedNode}
            style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', width: '100%', background: 'transparent', border: '1px solid #E03E3E', color: '#E03E3E', borderRadius: 4, padding: '6px 0', cursor: 'pointer', fontSize: 12 }}
          >
            <Trash2 size={13} /> Delete Node
          </button>
        </div>
      )}

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

      <div style={{ flex: 1, filter: isTimeTraveling ? 'grayscale(0.5) sepia(0.2)' : 'none', transition: 'filter 0.3s ease', opacity: isLoadingGraph ? 0.4 : 1 }} className="animate-fade-in">
        <ReactFlow
          nodes={(isTimeTraveling ? nodes : actualNodes).map(n => ({ ...n, selected: n.id === selectedNodeId }))}
          edges={isTimeTraveling ? edges : actualEdges}
          onNodesChange={isTimeTraveling ? undefined : onNodesChange}
          onEdgesChange={isTimeTraveling ? undefined : onEdgesChange}
          onConnect={isTimeTraveling ? undefined : onConnect}
          onNodeClick={isTimeTraveling ? undefined : (_, node) => setSelectedNodeId(node.id)}
          onPaneClick={() => setSelectedNodeId(null)}
          onNodeDragStop={isTimeTraveling ? undefined : persistCurrentGraph}
          onNodesDelete={isTimeTraveling ? undefined : () => { setSelectedNodeId(null); persistCurrentGraph(); }}
          onEdgesDelete={isTimeTraveling ? undefined : persistCurrentGraph}
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

      {/* Debug Logs Side Panel */}
      {showDebug && (
        <div style={{ width: 350, borderLeft: '1px solid var(--border-color)', backgroundColor: '#1e1e1e', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', fontSize: 13 }}>
            Execution Logs
          </div>
          <div style={{ padding: 16 }}>
            {debugLogs.length === 0 ? (
              <div style={{ color: '#888', fontSize: 12 }}>No executions yet.</div>
            ) : (
              debugLogs.map((log, i) => (
                <div key={i} style={{ marginBottom: 16, padding: 12, backgroundColor: '#252526', borderRadius: 6, border: '1px solid #333' }}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>{log.timestamp}</div>
                  <pre style={{ margin: 0, fontSize: 10, color: '#d4d4d4', overflowX: 'auto' }}>
                    {JSON.stringify(log.response, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      )}

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
