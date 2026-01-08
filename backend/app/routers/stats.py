from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import random

from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/weekly", response_model=schemas.Stats)
def weekly_stats(
    telegram_id: str = Query(...),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.telegram_id == telegram_id).first()
    if not user:
        return schemas.Stats(
            today_done=0, today_key_done=0, week_done=0, week_key_done=0
        )

    now = datetime.now(timezone.utc)
    start_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start_week = start_today - timedelta(days=7)

    q = db.query(models.Task).filter(
        models.Task.user_id == user.id,
        models.Task.status == "done",
        models.Task.completed_at != None,
    )

    today_tasks = q.filter(models.Task.completed_at >= start_today).all()
    week_tasks = q.filter(models.Task.completed_at >= start_week).all()

    today_done = len(today_tasks)
    today_key_done = len([t for t in today_tasks if t.is_key])
    week_done = len(week_tasks)
    week_key_done = len([t for t in week_tasks if t.is_key])

    return schemas.Stats(
        today_done=today_done,
        today_key_done=today_key_done,
        week_done=week_done,
        week_key_done=week_key_done,
    )


@router.get("/motivation")
def motivation(
    telegram_id: str = Query(...),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.telegram_id == telegram_id).first()
    if not user:
        return {"text": "Начнём с одной небольшой задачи."}

    total_today = (
        db.query(models.Task)
        .filter(models.Task.user_id == user.id, models.Task.status == "done")
        .count()
    )

    if total_today == 0:
        kind = "nudge"
    elif total_today >= 5:
        kind = "praise"
    else:
        kind = random.choice(["praise", "nudge"])

    msgs = (
        db.query(models.MotivationMessage)
        .filter(models.MotivationMessage.kind == kind)
        .all()
    )
    if not msgs:
        return {"text": "Продолжайте, прогресс уже есть."}
    msg = random.choice(msgs)
    return {"text": msg.text}
