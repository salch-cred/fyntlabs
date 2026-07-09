import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any

app = FastAPI()

# Allow CORS for the Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GraphData(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

@app.post("/api/execute-agent")
async def execute_agent(graph: GraphData):
    # This endpoint simulates an n8n Agent execution
    # In a real app, it would use LangChain/OpenAI to determine execution path based on tools (nodes)
    
    # 1. Identify if an Agent Node exists in the graph
    has_agent = any(node.get("type") == "agentNode" for node in graph.nodes)
    
    if not has_agent:
        return {"status": "error", "message": "No n8n Agent Node found in the workflow."}
    
    # 2. Simulate "thinking" delay
    await asyncio.sleep(1.5)
    
    # 3. Formulate a response mocking an autonomous agent's decision
    # (Pretending the agent read the graph, used an extraction tool, and decided to email)
    return {
        "status": "success",
        "agent_reasoning": [
            "Agent: Identifying available tools in the workflow...",
            "Agent: Found 'Extract Data' tool and 'Send Email' tool.",
            "Agent: Executing 'Extract Data' tool...",
            "Tool Response: Extracted 3 key insights from PDF.",
            "Agent: Executing 'Send Email' tool with extracted insights...",
            "Tool Response: Email sent successfully.",
            "Agent: Workflow complete."
        ],
        "nodes_executed": ["extractNode", "outputNode"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
