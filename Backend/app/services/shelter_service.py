from motor.motor_asyncio import AsyncIOMotorDatabase

from app.utils.geo import haversine_km, maps_navigation_url


async def find_nearby_shelters(
    db: AsyncIOMotorDatabase,
    lat: float,
    lng: float,
    radius_km: float = 20,
    status: str | None = None,
    min_capacity: int | None = None,
    limit: int = 20,
) -> list[dict]:
    match_stage: dict = {}
    if status:
        match_stage["status"] = status
    if min_capacity:
        match_stage["capacity"] = {"$gte": min_capacity}

    pipeline = [
        {
            "$geoNear": {
                "near": {"type": "Point", "coordinates": [lng, lat]},
                "distanceField": "distance_m",
                "maxDistance": radius_km * 1000,
                "spherical": True,
                "query": match_stage,
            }
        },
        {"$limit": limit},
    ]

    results = []
    async for doc in db.shelters.aggregate(pipeline):
        s_lng, s_lat = doc["location"]["coordinates"]
        results.append(
            {
                "id": str(doc["_id"]),
                "name": doc["name"],
                "lat": s_lat,
                "lng": s_lng,
                "distance_km": round(doc["distance_m"] / 1000, 2),
                "capacity": doc["capacity"],
                "occupancy": doc["occupancy"],
                "status": doc["status"],
                "navigation_url": maps_navigation_url(s_lat, s_lng),
            }
        )
    return results


async def seed_shelters_if_empty(db: AsyncIOMotorDatabase) -> None:
    from app.models.shelter import SEED_SHELTERS, shelter_document

    if await db.shelters.count_documents({}) > 0:
        return
    docs = [shelter_document(**s) for s in SEED_SHELTERS]
    await db.shelters.insert_many(docs)
