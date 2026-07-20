from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.core.dependencies import get_current_user
from app.services import shelter_service
from app.utils.responses import success_response

router = APIRouter(prefix="/shelters", tags=["Shelter Finder"])


@router.get("/nearby")
async def nearby_shelters(
    lat: float = Query(26.9124),
    lng: float = Query(75.7873),
    radius_km: float = Query(20, ge=1, le=100),
    status: str | None = Query(None, description="open | nearing_capacity | full | closed"),
    min_capacity: int | None = Query(None, ge=0),
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    data = await shelter_service.find_nearby_shelters(
        db, lat, lng, radius_km=radius_km, status=status, min_capacity=min_capacity
    )
    return success_response(data=data)
