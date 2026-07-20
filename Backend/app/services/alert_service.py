from datetime import datetime, timezone

from bson import ObjectId
from loguru import logger
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.utils.email import send_email


async def list_alerts(db: AsyncIOMotorDatabase, limit: int = 20) -> list[dict]:
    cursor = db.alerts.find().sort("created_at", -1).limit(limit)
    return [
        {
            "id": str(a["_id"]),
            "title": a["title"],
            "severity": a["severity"],
            "description": a["description"],
            "created_at": a["created_at"].isoformat(),
        }
        async for a in cursor
    ]


async def seed_alerts_if_empty(db: AsyncIOMotorDatabase) -> None:
    if await db.alerts.count_documents({}) > 0:
        return
    now = datetime.now(timezone.utc)
    await db.alerts.insert_many(
        [
            {"title": "Heavy Rain Warning", "severity": "warning", "description": "Sustained heavy rainfall expected across the district through tonight.", "created_at": now},
            {"title": "Flood Warning", "severity": "danger", "description": "River levels rising near low-lying residential zones. Monitor closely.", "created_at": now},
            {"title": "Fire Alert", "severity": "danger", "description": "Brush fire reported 6 km northeast. Fire services on site.", "created_at": now},
        ]
    )


async def trigger_sos(db: AsyncIOMotorDatabase, user: dict, action: str, lat: float | None, lng: float | None) -> dict:
    """
    Logs the SOS event and, depending on `action`, fans out to the
    relevant channel. `notify_contacts` and `share_location` email the
    user's saved emergency contacts (with a Google Maps link when
    location is available); call/find_shelter have their own concrete
    data paths below.
    """
    event = {
        "user_id": ObjectId(user["_id"]),
        "action": action,
        "lat": lat,
        "lng": lng,
        "created_at": datetime.now(timezone.utc),
    }
    await db.sos_events.insert_one(event)
    logger.warning("SOS triggered by {} — action={}", user.get("email"), action)

    result: dict = {"action": action, "status": "logged"}

    maps_link = f"https://maps.google.com/?q={lat},{lng}" if lat is not None and lng is not None else None

    if action in ("notify_contacts", "share_location"):
        contacts = await db.emergency_contacts.find({"user_id": ObjectId(user["_id"])}).to_list(length=20)

        if action == "notify_contacts":
            subject = f"SOS Alert from {user.get('name', 'a ResQ user')}"
            body = f"{user.get('name', 'A ResQ user')} has triggered an SOS alert and needs help."
        else:
            subject = f"{user.get('name', 'A ResQ user')} shared their live location"
            body = f"{user.get('name', 'A ResQ user')} shared their live location with you via ResQ."

        if maps_link:
            body += f"\n\nLocation: {maps_link}"
        else:
            body += "\n\nLocation was not available at the time of this alert."

        sent = 0
        for contact in contacts:
            email = contact.get("email")
            if email and send_email(email, subject, body):
                sent += 1

        result["status"] = "sent" if sent else "logged"
        result["contacts_notified"] = len(contacts)
        result["emails_sent"] = sent

    elif action == "call":
        result["emergency_number"] = "112"

    elif action == "find_shelter":
        from app.services.shelter_service import find_nearby_shelters

        if lat is not None and lng is not None:
            shelters = await find_nearby_shelters(db, lat, lng, radius_km=15, limit=1)
            result["nearest_shelter"] = shelters[0] if shelters else None

    return result
