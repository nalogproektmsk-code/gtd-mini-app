from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from .database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(String, unique=True, index=True)
    name = Column(String, nullable=True)
    golden_hours = Column(String, nullable=True)  # "morning" / "evening" / None

    tasks = relationship("Task", back_populates="user")
    projects = relationship("Project", back_populates="user")


class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    outcome = Column(Text, nullable=False)
    steps = Column(Text, nullable=True)  # JSON или многострочный текст
    first_step = Column(Text, nullable=True)

    user = relationship("User", back_populates="projects")
    tasks = relationship("Task", back_populates="project")


class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)

    text = Column(Text, nullable=False)
    status = Column(String, index=True)  # inbox/someday/today/calendar/delegated/storage/done/project
    is_key = Column(Boolean, default=False)
    is_golden = Column(Boolean, default=False)

    responsible = Column(String, nullable=True)
    due_datetime = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    sorted_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="tasks")
    project = relationship("Project", back_populates="tasks")
    collaborators = relationship("TaskCollaborator", back_populates="task")


class TaskCollaborator(Base):
    __tablename__ = "task_collaborators"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    collaborator_telegram_id = Column(String, index=True)

    task = relationship("Task", back_populates="collaborators")


class MotivationMessage(Base):
    __tablename__ = "motivation_messages"
    id = Column(Integer, primary_key=True, index=True)
    kind = Column(String, index=True)  # "praise" / "nudge"
    text = Column(Text, nullable=False)
