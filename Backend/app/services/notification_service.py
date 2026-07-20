from datetime import datetime, timezone

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


async def list_notifications(db: AsyncIOMotorDatabase, user_id: str, unread_only: bool = False) -> list[dict]:
    query: dict = {"user_id": ObjectId(user_id)}
    if unread_only:
        query["read"] = False
    cursor = db.notifications.find(query).sort("created_at", -1).limit(50)
    return [
        {
            "id": str(n["_id"]),
            "title": n["title"],
            "body": n["body"],
            "read": n["read"],
            "created_at": n["created_at"].isoformat(),
        }
        async for n in cursor
    ]


async def mark_read(db: AsyncIOMotorDatabase, user_id: str, notification_id: str) -> None:
    await db.notifications.update_one(
        {"_id": ObjectId(notification_id), "user_id": ObjectId(user_id)},
        {"$set": {"read": True}},
    )


async def mark_all_read(db: AsyncIOMotorDatabase, user_id: str) -> None:
    await db.notifications.update_many({"user_id": ObjectId(user_id), "read": False}, {"$set": {"read": True}})


async def create_notification(db: AsyncIOMotorDatabase, user_id: str, title: str, body: str) -> None:
    """Architecture hook for push/email/SMS fan-out — currently just persists in-app."""
    await db.notifications.insert_one(
        {
            "user_id": ObjectId(user_id),
            "title": title,
            "body": body,
            "read": False,
            "created_at": datetime.now(timezone.utc),
        }
    )
