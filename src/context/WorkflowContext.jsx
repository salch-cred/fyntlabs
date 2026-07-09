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
  
  // Time Travel State
  const [history, setHistory] = useState([{ nodes: initialNodes, edges: initialEdges }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Fetch from backend on load
  useEffect(() => {
    fetch('http://localhost:8000/api/workflow')
      .then(res => res.json())
      .then(data => {
        if (data.nodes && data.nodes.length > 0) {
          setNodes(data.nodes);
          setEdges(data.edges);
          setHistory([{ nodes: data.nodes, edges: data.edges }]);
        }
      })
      .catch(err => console.error("Failed to load workflow", err));
  }, []);

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

  const pushHistory = useCallback((newNodes, newEdges) => {
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      const newState = [...sliced, { nodes: newNodes, edges: newEdges }];
      
      // Auto-save to backend when history updates
      saveWorkflowToBackend(newNodes, newEdges);
      
      return newState;
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

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
      pushHistory(newNodes, edges);
      return newNodes;
    });
  }, [setNodes, edges, pushHistory]);

  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => {
        const newEdges = addEdge({ ...params, animated: true }, eds);
        pushHistory(nodes, newEdges);
        return newEdges;
      });
    },
    [setEdges, nodes, pushHistory],
  );

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
      history,
      historyIndex,
      setHistoryIndex,
      isTimeTraveling: historyIndex < history.length - 1
    }}>
      {children}
    </WorkflowContext.Provider>
  );
};
