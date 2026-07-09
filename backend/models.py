from sqlalchemy import Column, Integer, String, JSON
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

class WorkflowNode(Base):
    __tablename__ = "workflow_nodes"
    id = Column(String, primary_key=True, index=True)
    type = Column(String)
    position = Column(JSON)
    data = Column(JSON)

class WorkflowEdge(Base):
    __tablename__ = "workflow_edges"
    id = Column(String, primary_key=True, index=True)
    source = Column(String)
    target = Column(String)
