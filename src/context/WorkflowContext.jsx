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

  // Save state to history on meaningful changes (debounced/simplified for demo)
  const saveToHistory = useCallback((newNodes, newEdges) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, { nodes: newNodes, edges: newEdges }];
    });
    setHistoryIndex(prev => prev + 1);
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
        saveToHistory(newNodes, newEdges);
        return newEdges;
      });
      return newNodes;
    });
  }, [setNodes, setEdges, saveToHistory]);

  const updateNodeData = useCallback((id, dataUpdater) => {
    setNodes(nds => {
      const newNodes = nds.map(n => {
        if (n.id === id) {
          return { ...n, data: dataUpdater(n.data) };
        }
        return n;
      });
      saveToHistory(newNodes, edges);
      return newNodes;
    });
  }, [setNodes, edges, saveToHistory]);

  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => {
        const newEdges = addEdge({ ...params, animated: true }, eds);
        saveToHistory(nodes, newEdges);
        return newEdges;
      });
    },
    [setEdges, nodes, saveToHistory],
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
