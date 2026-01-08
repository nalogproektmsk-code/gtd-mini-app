from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class TaskBase(BaseModel):
    text: str
    is_key: bool = False
    is_golden: bool = False
    status: str = "inbox"
    responsible: Optional[str] = None
    due_datetime: Optional[datetime] = None
    project_id: Optional[int] = None
    collaborators: List[str] = []


class TaskCreate(TaskBase):
    pass


class Task(TaskBase):
    id: int
    created_at: Optional[datetime] = None
    sorted_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SortAnswers(BaseModel):
    need_action: bool
    urgent_this_week: Optional[bool] = None
    do_by_me: Optional[bool] = None
    one_step: Optional[bool] = None
    can_do_now: Optional[bool] = None
    has_datetime: Optional[bool] = None
    datetime: Optional[datetime] = None
    responsible: Optional[str] = None
    project_outcome: Optional[str] = None
    project_steps: Optional[str] = None
    project_first_step: Optional[str] = None


class Stats(BaseModel):
    today_done: int
    today_key_done: int
    week_done: int
    week_key_done: int

    class Config:
        from_attributes = True
