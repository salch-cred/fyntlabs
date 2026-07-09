import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNodesState, useEdgesState, addEdge } from '@xyflow/react';

const WorkflowContext = createContext();

export const useWorkflow = () => useContext(WorkflowContext);

const initialNodes = [
  { id: '1', type: 'triggerNode', position: { x: 250, y: 50 }, data: { description: 'Start the workflow manually' } },
];

const initialEdges = [];

const DEFAULT_WORKFLOW_ID = 'default';

export const WorkflowProvider = ({ children }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Which saved workflow ("flow") is currently open, and the list of all
  // saved workflows (like Gumloop's multiple flows / Notion's multiple pages)
  const [currentWorkflowId, setCurrentWorkflowId] = useState(DEFAULT_WORKFLOW_ID);
  const [workflowList, setWorkflowList] = useState([]);
  const [isLoadingGraph, setIsLoadingGraph] = useState(true);

  // Time Travel State — history and the current pointer are kept in ONE state
  // object so every update is derived atomically from the true latest state.
  // (Keeping them as two separate useState calls allowed rapid, synchronous
  // pushHistory calls — e.g. resetting many node statuses in a loop — to read
  // a stale `historyIndex` closure and corrupt the array, crashing the app
  // with "Cannot read properties of undefined (reading 'nodes')".)
  const [timeline, setTimeline] = useState({
    history: [{ nodes: initialNodes, edges: initialEdges }],
    index: 0,
  });
  const { history, index: historyIndex } = timeline;

  // Load the list of saved workflows once on mount
  const refreshWorkflowList = useCallback(() => {
    fetch('http://localhost:8000/api/workflows')
      .then(res => res.json())
      .then(list => setWorkflowList(list))
      .catch(err => console.error('Failed to load workflow list', err));
  }, []);

  useEffect(() => {
    refreshWorkflowList();
  }, [refreshWorkflowList]);

  // Load the graph for whichever workflow is currently selected
  useEffect(() => {
    setIsLoadingGraph(true);
    fetch(`http://localhost:8000/api/workflows/${currentWorkflowId}/graph`)
      .then(res => res.json())
      .then(data => {
        const loadedNodes = data.nodes && data.nodes.length > 0 ? data.nodes : (currentWorkflowId === DEFAULT_WORKFLOW_ID ? initialNodes : []);
        const loadedEdges = data.edges || [];
        setNodes(loadedNodes);
        setEdges(loadedEdges);
        setTimeline({ history: [{ nodes: loadedNodes, edges: loadedEdges }], index: 0 });
      })
      .catch(err => console.error('Failed to load workflow graph', err))
      .finally(() => setIsLoadingGraph(false));
  }, [currentWorkflowId, setNodes, setEdges]);

  // Save to backend function — always writes to the currently open workflow
  const saveWorkflowToBackend = useCallback(async (currentNodes, currentEdges) => {
    try {
      await fetch(`http://localhost:8000/api/workflows/${currentWorkflowId}/graph`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: currentNodes, edges: currentEdges })
      });
    } catch (err) {
      console.error("Failed to save workflow", err);
    }
  }, [currentWorkflowId]);

  // Appends a new snapshot to the timeline. Always derives the insertion
  // point from `prev` (the truly latest queued state), never from an
  // outside closure, so it stays correct even when called multiple times
  // synchronously in the same tick (e.g. a forEach over many nodes).
  const pushHistory = useCallback((newNodes, newEdges) => {
    saveWorkflowToBackend(newNodes, newEdges);
    setTimeline((prev) => {
      const sliced = prev.history.slice(0, prev.index + 1);
      const newHistory = [...sliced, { nodes: newNodes, edges: newEdges }];
      return { history: newHistory, index: newHistory.length - 1 };
    });
  }, [saveWorkflowToBackend]);

  // Snapshot + persist whatever the latest nodes/edges are right now, without
  // changing them. Used after drag-stop and keyboard deletions, where
  // ReactFlow has already mutated local state via onNodesChange/onEdgesChange
  // and we just need to record + save that result.
  const persistCurrentGraph = useCallback(() => {
    setNodes(nds => {
      setEdges(eds => {
        pushHistory(nds, eds);
        return eds;
      });
      return nds;
    });
  }, [setNodes, setEdges, pushHistory]);

  const addNode = useCallback((type, title, description, position) => {
    setNodes(nds => {
      const newNode = {
        id: `${Date.now()}`,
        type,
        position: position || { x: 250 + Math.round(Math.random() * 80), y: nds.length * 150 + 50 },
        data: { description, title }
      };
      const newNodes = [...nds, newNode];

      // Auto-connect to last node when adding from the editor's inline shortcuts
      setEdges(eds => {
        let newEdges = eds;
        if (nds.length > 0 && !position) {
          const newEdge = { id: `e-${nds[nds.length - 1].id}-${newNode.id}`, source: nds[nds.length - 1].id, target: newNode.id, animated: true };
          newEdges = [...eds, newEdge];
        }
        pushHistory(newNodes, newEdges);
        return newEdges;
      });
      return newNodes;
    });
  }, [setNodes, setEdges, pushHistory]);

  const updateNodeData = useCallback((id, dataUpdater) => {
    setNodes(nds => {
      const newNodes = nds.map(n => {
        if (n.id === id) {
          return { ...n, data: dataUpdater(n.data) };
        }
        return n;
      });
      setEdges(eds => {
        pushHistory(newNodes, eds);
        return eds;
      });
      return newNodes;
    });
  }, [setNodes, setEdges, pushHistory]);

  const deleteNode = useCallback((id) => {
    setNodes(nds => {
      const newNodes = nds.filter(n => n.id !== id);
      setEdges(eds => {
        const newEdges = eds.filter(e => e.source !== id && e.target !== id);
        pushHistory(newNodes, newEdges);
        return newEdges;
      });
      return newNodes;
    });
  }, [setNodes, setEdges, pushHistory]);

  const deleteEdge = useCallback((id) => {
    setEdges(eds => {
      const newEdges = eds.filter(e => e.id !== id);
      setNodes(nds => {
        pushHistory(nds, newEdges);
        return nds;
      });
      return newEdges;
    });
  }, [setNodes, setEdges, pushHistory]);

  // Replace the entire graph (e.g. after AI-generating a workflow from a document)
  const loadWorkflow = useCallback((newNodes, newEdges) => {
    setNodes(newNodes);
    setEdges(newEdges);
    pushHistory(newNodes, newEdges);
  }, [setNodes, setEdges, pushHistory]);

  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => {
        const newEdges = addEdge({ ...params, animated: true }, eds);
        setNodes(nds => {
          pushHistory(nds, newEdges);
          return nds;
        });
        return newEdges;
      });
    },
    [setEdges, setNodes, pushHistory],
  );

  const setHistoryIndex = useCallback((newIndex) => {
    setTimeline(prev => ({ ...prev, index: newIndex }));
  }, []);

  // --- Multi-workflow management (like Gumloop's multiple flows) ---
  const switchWorkflow = useCallback((id) => {
    setCurrentWorkflowId(id || DEFAULT_WORKFLOW_ID);
  }, []);

  const createWorkflow = useCallback(async (name) => {
    const res = await fetch('http://localhost:8000/api/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name || 'Untitled Workflow' })
    });
    const wf = await res.json();
    setWorkflowList(prev => [...prev, wf]);
    setCurrentWorkflowId(wf.id);
    return wf;
  }, []);

  const renameWorkflow = useCallback(async (id, name) => {
    await fetch(`http://localhost:8000/api/workflows/${id}/rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    setWorkflowList(prev => prev.map(w => w.id === id ? { ...w, name } : w));
  }, []);

  const deleteWorkflow = useCallback(async (id) => {
    if (id === DEFAULT_WORKFLOW_ID) return;
    await fetch(`http://localhost:8000/api/workflows/${id}`, { method: 'DELETE' });
    setWorkflowList(prev => prev.filter(w => w.id !== id));
    if (currentWorkflowId === id) {
      setCurrentWorkflowId(DEFAULT_WORKFLOW_ID);
    }
  }, [currentWorkflowId]);

  return (
    <WorkflowContext.Provider value={{
      nodes: history[historyIndex].nodes,
      edges: history[historyIndex].edges,
      actualNodes: nodes, // Needed for ReactFlow state when not time-traveling
      actualEdges: edges,
      onNodesChange,
      onEdgesChange,
      onConnect,
      addNode,
      updateNodeData,
      deleteNode,
      deleteEdge,
      persistCurrentGraph,
      loadWorkflow,
      history,
      historyIndex,
      setHistoryIndex,
      isTimeTraveling: historyIndex < history.length - 1,
      isLoadingGraph,
      currentWorkflowId,
      workflowList,
      switchWorkflow,
      createWorkflow,
      renameWorkflow,
      deleteWorkflow,
      refreshWorkflowList,
    }}>
      {children}
    </WorkflowContext.Provider>
  );
};
