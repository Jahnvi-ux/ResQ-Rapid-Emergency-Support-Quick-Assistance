from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.core.dependencies import get_current_user
from app.services import emergency_service_service
from app.utils.responses import success_response

router = APIRouter(prefix="/emergency-services", tags=["Emergency Services"])


@router.get("/nearby")
async def nearby_services(
    lat: float = Query(26.9124),
    lng: float = Query(75.7873),
    radius_km: float = Query(20, ge=1, le=100),
    type: str | None = Query(None, description="hospital | police | fire_station | relief_camp"),
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    data = await emergency_service_service.find_nearby_services(db, lat, lng, radius_km=radius_km, type=type)
    return success_response(data=data)
