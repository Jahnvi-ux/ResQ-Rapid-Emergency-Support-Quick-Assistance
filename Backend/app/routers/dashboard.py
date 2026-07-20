from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.core.dependencies import get_current_user
from app.services import dashboard_service
from app.utils.responses import success_response

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
async def dashboard_summary(
    lat: float = Query(26.9124),
    lng: float = Query(75.7873),
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    data = await dashboard_service.get_dashboard_summary(db, current_user, lat, lng)
    return success_response(data=data)
