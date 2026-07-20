from motor.motor_asyncio import AsyncIOMotorDatabase

from app.services import emergency_service_service, shelter_service, weather_service
from app.services.ai_service import get_ai_provider


async def get_dashboard_summary(db: AsyncIOMotorDatabase, user: dict, lat: float, lng: float) -> dict:
    weather = await weather_service.get_current_weather_cached(db, lat, lng)
    shelters = await shelter_service.find_nearby_shelters(db, lat, lng, radius_km=15, limit=3)
    services = await emergency_service_service.find_nearby_services(db, lat, lng, radius_km=15, limit=4)

    alerts_cursor = db.alerts.find().sort("created_at", -1).limit(5)
    alerts = [
        {
            "id": str(a["_id"]),
            "title": a["title"],
            "severity": a["severity"],
            "description": a["description"],
            "created_at": a["created_at"].isoformat(),
        }
        async for a in alerts_cursor
    ]

    unread_notifications = await db.notifications.count_documents({"user_id": user["_id"], "read": False})

    disaster_risk = {"level": "Moderate", "type": "Flood", "confidence_pct": 68}

    recommendations = await get_ai_provider().get_recommendations(context={"weather": weather, "risk": disaster_risk})

    return {
        "weather": weather,
        "disaster_risk": disaster_risk,
        "nearby_shelters": shelters,
        "nearby_emergency_services": services,
        "latest_alerts": alerts,
        "unread_notifications_count": unread_notifications,
        "statistics": {
            "shelters_mapped": await db.shelters.count_documents({}),
            "active_alerts": await db.alerts.count_documents({}),
        },
        "ai_recommendations": recommendations,
    }
