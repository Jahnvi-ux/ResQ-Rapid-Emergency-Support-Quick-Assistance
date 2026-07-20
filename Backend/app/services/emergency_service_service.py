from motor.motor_asyncio import AsyncIOMotorDatabase

from app.utils.geo import maps_navigation_url


async def find_nearby_services(
    db: AsyncIOMotorDatabase,
    lat: float,
    lng: float,
    radius_km: float = 20,
    type: str | None = None,
    limit: int = 20,
) -> list[dict]:
    match_stage: dict = {}
    if type:
        match_stage["type"] = type

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
    async for doc in db.emergency_services.aggregate(pipeline):
        s_lng, s_lat = doc["location"]["coordinates"]
        results.append(
            {
                "id": str(doc["_id"]),
                "name": doc["name"],
                "type": doc["type"],
                "lat": s_lat,
                "lng": s_lng,
                "distance_km": round(doc["distance_m"] / 1000, 2),
                "phone": doc["phone"],
                "navigation_url": maps_navigation_url(s_lat, s_lng),
            }
        )
    return results


async def seed_services_if_empty(db: AsyncIOMotorDatabase) -> None:
    from app.models.emergency_service import SEED_SERVICES, emergency_service_document

    if await db.emergency_services.count_documents({}) > 0:
        return
    docs = [emergency_service_document(**s) for s in SEED_SERVICES]
    await db.emergency_services.insert_many(docs)
