from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/tasks", tags=["tasks"])


def get_or_create_user(db: Session, telegram_id: str, name: str | None = None):
    user = db.query(models.User).filter(models.User.telegram_id == telegram_id).first()
    if not user:
        user = models.User(telegram_id=telegram_id, name=name)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@router.post("/", response_model=schemas.Task)
def create_task(
    task: schemas.TaskCreate,
    telegram_id: str = Query(...),
    name: str | None = Query(None),
    db: Session = Depends(get_db),
):
    user = get_or_create_user(db, telegram_id, name)
    db_task = models.Task(
        user_id=user.id,
        text=task.text,
        status=task.status,
        is_key=task.is_key,
        is_golden=task.is_golden,
        responsible=task.responsible,
        due_datetime=task.due_datetime,
        project_id=task.project_id,
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    for c_id in task.collaborators:
        coll = models.TaskCollaborator(
            task_id=db_task.id, collaborator_telegram_id=c_id
        )
        db.add(coll)
    db.commit()
    db.refresh(db_task)

    return db_task


@router.get("/", response_model=List[schemas.Task])
def list_tasks(
    status: str | None = None,
    telegram_id: str = Query(...),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.telegram_id == telegram_id).first()
    if not user:
        return []
    q = db.query(models.Task).filter(models.Task.user_id == user.id)
    if status:
        q = q.filter(models.Task.status == status)
    return q.order_by(models.Task.created_at.desc()).all()


@router.post("/{task_id}/sort", response_model=schemas.Task)
def sort_task(
    task_id: int,
    answers: schemas.SortAnswers,
    telegram_id: str = Query(...),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.telegram_id == telegram_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    task = (
        db.query(models.Task)
        .filter(models.Task.id == task_id, models.Task.user_id == user.id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not answers.need_action:
        task.status = "storage"
    else:
        if answers.urgent_this_week is False:
            task.status = "someday"
        else:
            if answers.do_by_me is False:
                task.status = "delegated"
                task.responsible = answers.responsible
            else:
                if answers.one_step is False:
                    if not answers.project_outcome or not answers.project_first_step:
                        raise HTTPException(status_code=400, detail="Project data required")
                    project = models.Project(
                        user_id=user.id,
                        title=task.text,
                        outcome=answers.project_outcome,
                        steps=answers.project_steps,
                        first_step=answers.project_first_step,
                    )
                    db.add(project)
                    db.commit()
                    db.refresh(project)

                    task.status = "project"
                    task.project_id = project.id

                    first_step_task = models.Task(
                        user_id=user.id,
                        text=answers.project_first_step,
                        status="today",
                        is_key=task.is_key,
                        is_golden=task.is_golden,
                        project_id=project.id,
                    )
                    db.add(first_step_task)
                else:
                    if answers.can_do_now:
                        task.status = "done"
                        task.completed_at = datetime.utcnow()
                    else:
                        if answers.has_datetime and answers.datetime:
                            task.status = "calendar"
                            task.due_datetime = answers.datetime
                        else:
                            task.status = "today"

    task.sorted_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    return task


@router.post("/{task_id}/complete", response_model=schemas.Task)
def complete_task(
    task_id: int,
    telegram_id: str = Query(...),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.telegram_id == telegram_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    task = (
        db.query(models.Task)
        .filter(models.Task.id == task_id, models.Task.user_id == user.id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.status = "done"
    task.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    return task
