import asyncio
import json
import sys
import io
import contextlib
import uuid
from datetime import datetime, timezone
from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from database import engine, SessionLocal, Base
import models
from pydantic import BaseModel

Base.metadata.create_all(bind=engine)

DEFAULT_WORKFLOW_ID = "default"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Pydantic Models ---
class DocumentBlockData(BaseModel):
    id: str
    type: str
    content: str

class WorkflowNodeData(BaseModel):
    id: str
    type: str
    position: dict
    data: dict

class WorkflowEdgeData(BaseModel):
    id: str
    source: str
    target: str

class WorkflowSaveData(BaseModel):
    nodes: List[WorkflowNodeData]
    edges: List[WorkflowEdgeData]

class PageSaveData(BaseModel):
    title: str
    blocks: List[DocumentBlockData]

# --- Document Endpoints ---
@app.get("/api/documents/{page_id}")
def get_documents(page_id: str, db: Session = Depends(get_db)):
    page = db.query(models.Page).filter(models.Page.id == page_id).first()
    blocks = db.query(models.DocumentBlock).filter(models.DocumentBlock.page_id == page_id).all()
    title = page.title if page else ""
    return {"title": title, "blocks": [{"id": b.id, "type": b.type, "content": b.content} for b in blocks]}

@app.post("/api/documents/{page_id}")
def save_documents(page_id: str, data: PageSaveData, db: Session = Depends(get_db)):
    page = db.query(models.Page).filter(models.Page.id == page_id).first()
    if not page:
        page = models.Page(id=page_id, title=data.title)
        db.add(page)
    else:
        page.title = data.title
        
    db.query(models.DocumentBlock).filter(models.DocumentBlock.page_id == page_id).delete()
    for b in data.blocks:
        new_block = models.DocumentBlock(id=b.id, page_id=page_id, type=b.type, content=b.content)
        db.add(new_block)
    db.commit()
    return {"status": "success"}

@app.delete("/api/documents/{page_id}")
def delete_document(page_id: str, db: Session = Depends(get_db)):
    db.query(models.DocumentBlock).filter(models.DocumentBlock.page_id == page_id).delete()
    db.query(models.Page).filter(models.Page.id == page_id).delete()
    db.commit()
    return {"status": "success"}

# --- Workflow Endpoints (multiple named workflows, like Gumloop's flows) ---

def ensure_default_workflow(db: Session):
    wf = db.query(models.Workflow).filter(models.Workflow.id == DEFAULT_WORKFLOW_ID).first()
    if not wf:
        wf = models.Workflow(id=DEFAULT_WORKFLOW_ID, name="Workflow Automation", created_at=datetime.now(timezone.utc).isoformat())
        db.add(wf)
        db.commit()
    return wf

@app.get("/api/workflows")
def list_workflows(db: Session = Depends(get_db)):
    ensure_default_workflow(db)
    workflows = db.query(models.Workflow).all()
    return [{"id": w.id, "name": w.name, "created_at": w.created_at} for w in workflows]

class WorkflowCreateData(BaseModel):
    name: Optional[str] = "Untitled Workflow"

@app.post("/api/workflows")
def create_workflow(payload: WorkflowCreateData, db: Session = Depends(get_db)):
    new_id = str(uuid.uuid4())[:8]
    wf = models.Workflow(id=new_id, name=payload.name or "Untitled Workflow", created_at=datetime.now(timezone.utc).isoformat())
    db.add(wf)
    db.commit()
    return {"id": wf.id, "name": wf.name, "created_at": wf.created_at}

class WorkflowRenameData(BaseModel):
    name: str

@app.post("/api/workflows/{workflow_id}/rename")
def rename_workflow(workflow_id: str, payload: WorkflowRenameData, db: Session = Depends(get_db)):
    wf = db.query(models.Workflow).filter(models.Workflow.id == workflow_id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    wf.name = payload.name
    db.commit()
    return {"status": "success"}

@app.delete("/api/workflows/{workflow_id}")
def delete_workflow(workflow_id: str, db: Session = Depends(get_db)):
    if workflow_id == DEFAULT_WORKFLOW_ID:
        raise HTTPException(status_code=400, detail="Cannot delete the default workflow")
    db.query(models.WorkflowNode).filter(models.WorkflowNode.workflow_id == workflow_id).delete()
    db.query(models.WorkflowEdge).filter(models.WorkflowEdge.workflow_id == workflow_id).delete()
    db.query(models.Workflow).filter(models.Workflow.id == workflow_id).delete()
    db.commit()
    return {"status": "success"}

@app.get("/api/workflows/{workflow_id}/graph")
def get_workflow_graph(workflow_id: str, db: Session = Depends(get_db)):
    if workflow_id == DEFAULT_WORKFLOW_ID:
        ensure_default_workflow(db)
    nodes = db.query(models.WorkflowNode).filter(models.WorkflowNode.workflow_id == workflow_id).all()
    edges = db.query(models.WorkflowEdge).filter(models.WorkflowEdge.workflow_id == workflow_id).all()
    return {
        "nodes": [{"id": n.id, "type": n.type, "position": n.position, "data": n.data} for n in nodes],
        "edges": [{"id": e.id, "source": e.source, "target": e.target} for e in edges]
    }

@app.post("/api/workflows/{workflow_id}/graph")
def save_workflow_graph(workflow_id: str, data: WorkflowSaveData, db: Session = Depends(get_db)):
    wf = db.query(models.Workflow).filter(models.Workflow.id == workflow_id).first()
    if not wf:
        default_name = "Workflow Automation" if workflow_id == DEFAULT_WORKFLOW_ID else "Untitled Workflow"
        wf = models.Workflow(id=workflow_id, name=default_name, created_at=datetime.now(timezone.utc).isoformat())
        db.add(wf)

    db.query(models.WorkflowNode).filter(models.WorkflowNode.workflow_id == workflow_id).delete()
    db.query(models.WorkflowEdge).filter(models.WorkflowEdge.workflow_id == workflow_id).delete()

    for node in data.nodes:
        db_node = models.WorkflowNode(id=node.id, workflow_id=workflow_id, type=node.type, position=node.position, data=node.data)
        db.add(db_node)

    for edge in data.edges:
        db_edge = models.WorkflowEdge(id=edge.id, workflow_id=workflow_id, source=edge.source, target=edge.target)
        db.add(db_edge)

    db.commit()
    return {"status": "success"}

class GraphData(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

@app.post("/api/execute-agent")
async def execute_agent(graph: GraphData):
    # Simulated execution logic
    has_agent = any(node.get("type") == "agentNode" for node in graph.nodes)
    
    if not has_agent:
        return {"status": "error", "message": "No n8n Agent Node found in the workflow."}
    
    await asyncio.sleep(1.5)
    
    return {
        "status": "success",
        "agent_reasoning": [
            "Agent: Identifying available tools...",
            "Agent: Found tools in graph.",
            "Agent: Executing plan...",
            "Tool Response: Success.",
            "Agent: Workflow complete."
        ],
        "nodes_executed": ["extractNode", "outputNode"]
    }

# --- Developer Endpoints ---
class CodePayload(BaseModel):
    code: str

@app.post("/api/execute-code")
def execute_code(payload: CodePayload):
    # DANGEROUS: Executes arbitrary Python code. For MVP demonstration only!
    output = io.StringIO()
    try:
        with contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
            exec(payload.code, {"__builtins__": __builtins__}, {})
        result = output.getvalue()
    except Exception as e:
        result = str(e)
    
    return {"output": result}

class AutoFixPayload(BaseModel):
    code: str
    error: str

@app.post("/api/auto-fix")
def auto_fix_code(payload: AutoFixPayload):
    # Simulates an AI reading the traceback and rewriting the code
    # For MVP, we will do a simple string replacement based on common errors, or just wrap it in a try-except.
    
    fixed_code = payload.code
    if "ZeroDivisionError" in payload.error:
        fixed_code = payload.code.replace("1 / 0", "1 / 1 # Fixed division by zero")
    elif "NameError" in payload.error:
        fixed_code = f"import math\nimport os\n{payload.code}" # Generic fix attempt
    else:
        fixed_code = f"# AI Auto-Fixed\n{payload.code}\n# Attempted to fix: {payload.error.splitlines()[-1] if payload.error else 'Unknown Error'}"
        
    return {"status": "success", "fixed_code": fixed_code}

class DocPayload(BaseModel):
    text: str

@app.post("/api/generate-workflow")
def generate_workflow(payload: DocPayload):
    # Simulates an LLM parsing the document text and returning a workflow schema
    text = payload.text.lower()
    
    nodes = [
        { "id": "gen-1", "type": "triggerNode", "position": { "x": 250, "y": 50 }, "data": { "title": "Start", "description": "Auto-generated trigger" } }
    ]
    edges = []
    
    y_offset = 200
    if "extract" in text or "data" in text:
        nodes.append({ "id": "gen-2", "type": "extractNode", "position": { "x": 250, "y": y_offset }, "data": { "title": "Extract Data", "description": "Auto-extracted" } })
        edges.append({ "id": "e1-2", "source": "gen-1", "target": "gen-2", "animated": True })
        y_offset += 150
        
    if "email" in text or "send" in text:
        prev_node = nodes[-1]["id"]
        new_node_id = f"gen-{len(nodes)+1}"
        nodes.append({ "id": new_node_id, "type": "outputNode", "position": { "x": 250, "y": y_offset }, "data": { "title": "Send Email", "description": "Auto-generated" } })
        edges.append({ "id": f"e{prev_node}-{new_node_id}", "source": prev_node, "target": new_node_id, "animated": True })
        
    if len(nodes) == 1: # Default if no keywords match
        nodes.append({ "id": "gen-2", "type": "agentNode", "position": { "x": 250, "y": 200 }, "data": { "title": "AI Agent", "description": "Auto-generated" } })
        edges.append({ "id": "e1-2", "source": "gen-1", "target": "gen-2", "animated": True })
        
    return {"status": "success", "nodes": nodes, "edges": edges}

@app.post("/api/webhook/{workflow_id}")
async def trigger_webhook(workflow_id: str, request: Request):
    payload = await request.json()
    # In a real app, this would query the DB for workflow_id and execute its nodes
    print(f"Webhook triggered for workflow {workflow_id} with payload: {payload}")
    return {"status": "success", "message": f"Workflow {workflow_id} triggered via webhook", "payload_received": payload}

# --- WebSocket Terminal ---
@app.websocket("/ws/terminal")
async def terminal_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # Simple simulation for echo or other commands
            if data.startswith("echo "):
                await websocket.send_text(data[5:])
            elif data == "npm run dev":
                await websocket.send_text("> nextjs-portfolio@0.1.0 dev")
                await websocket.send_text("> next dev")
                await websocket.send_text("ready - started server on 0.0.0.0:3000")
            elif data == "clear":
                await websocket.send_text("CLEAR_TERMINAL")
            else:
                await websocket.send_text(f"bash: {data}: command not found")
    except WebSocketDisconnect:
        print("Terminal disconnected")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
