from motor.motor_asyncio import AsyncIOMotorDatabase


async def seed_guides_if_empty(db: AsyncIOMotorDatabase) -> None:
    from app.models.guide import SEED_GUIDES

    if await db.emergency_guides.count_documents({}) > 0:
        return
    await db.emergency_guides.insert_many(SEED_GUIDES)


def _serialize(doc: dict) -> dict:
    return {
        "category": doc["category"],
        "label": doc["label"],
        "icon": doc["icon"],
        "before": doc["before"],
        "during": doc["during"],
        "after": doc["after"],
    }


async def list_guides(db: AsyncIOMotorDatabase) -> list[dict]:
    return [_serialize(doc) async for doc in db.emergency_guides.find()]


async def get_guide(db: AsyncIOMotorDatabase, category: str) -> dict | None:
    doc = await db.emergency_guides.find_one({"category": category})
    return _serialize(doc) if doc else None


async def search_guides(db: AsyncIOMotorDatabase, query: str) -> list[dict]:
    regex = {"$regex": query, "$options": "i"}
    cursor = db.emergency_guides.find(
        {"$or": [{"label": regex}, {"before": regex}, {"during": regex}, {"after": regex}]}
    )
    return [_serialize(doc) async for doc in cursor]
