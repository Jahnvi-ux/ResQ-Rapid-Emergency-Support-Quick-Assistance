from datetime import datetime, timezone

from bson import ObjectId
from loguru import logger
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.services.ai_service import get_ai_provider
from app.services.weather_service import get_current_weather_cached


async def send_message(
    db: AsyncIOMotorDatabase,
    user_id: str,
    message: str,
    image_base64: str | None = None,
    language: str | None = None,
    lat: float | None = None,
    lng: float | None = None,
) -> str:
    history_cursor = db.chat_history.find({"user_id": ObjectId(user_id)}).sort("created_at", -1).limit(10)
    history = [doc async for doc in history_cursor]
    history.reverse()

    weather_context = None
    logger.info("Chatbot weather lookup — lat={} lng={}", lat, lng)
    if lat is not None and lng is not None:
        try:
            w = await get_current_weather_cached(db, lat, lng)
            weather_context = (
                f"{w['condition']}, {w['temperature_c']}°C (feels like {w['feels_like_c']}°C), "
                f"humidity {w['humidity_pct']}%, wind {w['wind_kmh']} km/h, "
                f"{w['rainfall_chance_pct']}% chance of rain, in {w['location']}"
            )
            logger.info("Chatbot weather context: {}", weather_context)
        except Exception as exc:
            logger.warning("Chatbot weather lookup failed: {}", exc)
            weather_context = None
    else:
        logger.info("Chatbot weather skipped — no lat/lng received from frontend")

    reply = await get_ai_provider().chat(
        message, history, image_base64=image_base64, language=language, weather_context=weather_context
    )

    # Store what the user typed/said as-is; a short marker is appended when an
    # image was attached so chat history stays readable without saving the
    # (large) base64 payload itself.
    stored_message = f"{message} [image attached]" if image_base64 else message

    now = datetime.now(timezone.utc)
    await db.chat_history.insert_many(
        [
            {"user_id": ObjectId(user_id), "role": "user", "message": stored_message, "created_at": now},
            {"user_id": ObjectId(user_id), "role": "bot", "message": reply, "created_at": now},
        ]
    )
    return reply


async def get_history(db: AsyncIOMotorDatabase, user_id: str, limit: int = 50) -> list[dict]:
    cursor = db.chat_history.find({"user_id": ObjectId(user_id)}).sort("created_at", 1).limit(limit)
    return [
        {"role": doc["role"], "message": doc["message"], "created_at": doc["created_at"].isoformat()}
        async for doc in cursor
    ]


async def clear_history(db: AsyncIOMotorDatabase, user_id: str) -> None:
    await db.chat_history.delete_many({"user_id": ObjectId(user_id)})
