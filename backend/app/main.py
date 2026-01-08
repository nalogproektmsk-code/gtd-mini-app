import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy.orm import Session
from init_data_py import InitData

from .database import Base, engine, SessionLocal
from . import models
from .routers import tasks, stats

BOT_TOKEN = os.getenv("BOT_TOKEN")

Base.metadata.create_all(bind=engine)


def seed_motivation():
    db: Session = SessionLocal()
    phrases = [
        ("praise", "Отлично! Вы выполнили абсолютно все задачи!"),
        ("praise", "Отлично! Вы выполнили все задачи, запланированные на сегодня!"),
        ("praise", "Поздравляем с новым рекордом!"),
        ("praise", "Вы молодец, продолжайте в том же духе!"),
        ("nudge", "Давайте попробуем закрыть ещё одну задачу!"),
        ("nudge", "Давайте проконтролируем, выполнены ли ваши поручения!"),
        ("nudge", "Вы почти закрыли задачи на сегодня, осталось немного!"),
        ("nudge", "Супер! Ещё чуть-чуть до цели."),
    ]
    for kind, text in phrases:
        exists = (
            db.query(models.MotivationMessage)
            .filter(models.MotivationMessage.kind == kind, models.MotivationMessage.text == text)
            .first()
        )
        if not exists:
            db.add(models.MotivationMessage(kind=kind, text=text))
    db.commit()
    db.close()


seed_motivation()

app = FastAPI(title="GTD Mini App Backend")

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(tasks.router)
app.include_router(stats.router)
