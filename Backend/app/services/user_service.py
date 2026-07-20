from datetime import datetime, timezone

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.schemas.user import UserProfileUpdateRequest


def to_profile_response(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "phone": user.get("phone", ""),
        "address": user.get("address", ""),
        "age": user.get("age"),
        "gender": user.get("gender", ""),
        "blood_group": user.get("blood_group", ""),
        "medical_conditions": user.get("medical_conditions", ""),
        "emergency_contact": user.get("emergency_contact", {"name": "", "phone": "", "relation": ""}),
        "language": user.get("language", "English"),
        "avatar_url": user.get("avatar_url", ""),
        "is_verified": user.get("is_verified", False),
    }


async def update_profile(db: AsyncIOMotorDatabase, user_id: str, payload: UserProfileUpdateRequest) -> dict:
    update_data = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc)
        await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
    return await db.users.find_one({"_id": ObjectId(user_id)})


async def update_checklist(db: AsyncIOMotorDatabase, user_id: str, completed_indices: list[int]) -> list[int]:
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"checklist_state": completed_indices, "updated_at": datetime.now(timezone.utc)}},
    )
    return completed_indices
