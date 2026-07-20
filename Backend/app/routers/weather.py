from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.core.dependencies import get_current_user
from app.services import weather_service
from app.utils.responses import success_response

router = APIRouter(prefix="/weather", tags=["Weather"])


@router.get("/current")
async def current_weather(
    lat: float = Query(26.9124, description="Latitude, defaults to Jaipur"),
    lng: float = Query(75.7873, description="Longitude, defaults to Jaipur"),
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    data = await weather_service.get_current_weather_cached(db, lat, lng)
    return success_response(data=data)


@router.get("/forecast")
async def forecast(
    lat: float = Query(26.9124),
    lng: float = Query(75.7873),
    days: int = Query(7, ge=1, le=10),
    current_user: dict = Depends(get_current_user),
):
    data = await weather_service.get_weather_provider().get_forecast(lat, lng, days)
    return success_response(data=data)


@router.get("/alerts")
async def alerts(
    lat: float = Query(26.9124),
    lng: float = Query(75.7873),
    current_user: dict = Depends(get_current_user),
):
    data = await weather_service.get_weather_provider().get_alerts(lat, lng)
    return success_response(data=data)
