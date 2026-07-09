import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNodesState, useEdgesState, addEdge } from '@xyflow/react';

const WorkflowContext = createContext();

export const useWorkflow = () => useContext(WorkflowContext);

const initialNodes = [
  { id: '1', type: 'triggerNode', position: { x: 250, y: 50 }, data: { description: 'Start the workflow manually' } },
];

const initialEdges = [];

export const WorkflowProvider = ({ children }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

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

  // Fetch from backend on load
  useEffect(() => {
    fetch('http://localhost:8000/api/workflow')
      .then(res => res.json())
      .then(data => {
        if (data.nodes && data.nodes.length > 0) {
          setNodes(data.nodes);
          setEdges(data.edges);
          setTimeline({ history: [{ nodes: data.nodes, edges: data.edges }], index: 0 });
        }
      })
      .catch(err => console.error("Failed to load workflow", err));
  }, [setNodes, setEdges]);

  // Save to backend function
  const saveWorkflowToBackend = async (currentNodes, currentEdges) => {
    try {
      await fetch('http://localhost:8000/api/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: currentNodes, edges: currentEdges })
      });
    } catch (err) {
      console.error("Failed to save workflow", err);
    }
  };

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
  }, []);

  const addNode = useCallback((type, title, description) => {
    setNodes(nds => {
      const newNode = {
        id: (nds.length + 1).toString(),
        type,
        position: { x: 250, y: nds.length * 150 + 50 },
        data: { description, title }
      };
      const newNodes = [...nds, newNode];
      
      // Auto-connect to last node
      setEdges(eds => {
        let newEdges = eds;
        if (nds.length > 0) {
          const newEdge = { id: `e${nds.length}-${newNodes.length}`, source: nds[nds.length - 1].id, target: newNode.id, animated: true };
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
      loadWorkflow,
      history,
      historyIndex,
      setHistoryIndex,
      isTimeTraveling: historyIndex < history.length - 1
    }}>
      {children}
    </WorkflowContext.Provider>
  );
};
