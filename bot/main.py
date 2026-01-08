import os
from fastapi import FastAPI, Request
from aiogram import Bot, Dispatcher, types, Router
from aiogram.types import WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.filters import CommandStart
from aiogram.client.session.aiohttp import AiohttpSession
import uvicorn

BOT_TOKEN = os.getenv("BOT_TOKEN")
BACKEND_URL = os.getenv("BACKEND_URL")
FRONTEND_URL = os.getenv("FRONTEND_URL")

WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "secret")
WEBHOOK_PATH = f"/bot/{WEBHOOK_SECRET}"

session = AiohttpSession()
bot = Bot(token=BOT_TOKEN, session=session)
dp = Dispatcher()
router = Router()
dp.include_router(router)

app = FastAPI()


@router.message(CommandStart())
async def cmd_start(message: types.Message):
  kb = InlineKeyboardMarkup(
      inline_keyboard=[
          [
              InlineKeyboardButton(
                  text="Открыть систему",
                  web_app=WebAppInfo(url=FRONTEND_URL),
              )
          ]
      ]
  )
  await message.answer(
      "Это Mini App для системы личной эффективности. Нажми кнопку ниже, чтобы открыть.",
      reply_markup=kb,
  )


@router.message()
async def fallback(message: types.Message):
  await message.answer("Добавляй задачи через Mini App — нажми кнопку в меню бота.")


@app.post(WEBHOOK_PATH)
async def bot_webhook(request: Request):
  data = await request.json()
  update = types.Update(**data)
  await dp.feed_update(bot, update)
  return {"ok": True}


@app.on_event("startup")
async def on_startup():
  webhook_url = os.getenv("WEBHOOK_URL")
  if webhook_url is None:
      raise RuntimeError("WEBHOOK_URL is not set")
  await bot.set_webhook(url=webhook_url)


@app.on_event("shutdown")
async def on_shutdown():
  await bot.session.close()


if __name__ == "__main__":
  uvicorn.run("main:app", host="0.0.0.0", port=10000)
