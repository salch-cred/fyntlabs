from sqlalchemy import Column, Integer, String, JSON, PrimaryKeyConstraint
from database import Base

class Page(Base):
    __tablename__ = "pages"
    id = Column(String, primary_key=True)
    title = Column(String)

class DocumentBlock(Base):
    __tablename__ = "document_blocks"
    id = Column(String, primary_key=True)
    page_id = Column(String)
    type = Column(String, default="text")
    content = Column(String)

class Workflow(Base):
    __tablename__ = "workflows"
    id = Column(String, primary_key=True)
    name = Column(String, default="Untitled Workflow")
    created_at = Column(String)

class WorkflowNode(Base):
    __tablename__ = "workflow_nodes"
    id = Column(String, index=True)
    workflow_id = Column(String, index=True)
    type = Column(String)
    position = Column(JSON)
    data = Column(JSON)

    __table_args__ = (PrimaryKeyConstraint("id", "workflow_id"),)

class WorkflowEdge(Base):
    __tablename__ = "workflow_edges"
    id = Column(String, index=True)
    workflow_id = Column(String, index=True)
    source = Column(String)
    target = Column(String)

    __table_args__ = (PrimaryKeyConstraint("id", "workflow_id"),)
