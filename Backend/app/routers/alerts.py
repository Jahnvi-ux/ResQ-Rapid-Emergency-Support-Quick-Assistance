from fastapi import APIRouter, Depends, Request
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.core.dependencies import get_current_user, limiter
from app.schemas.alert import SOSRequest
from app.services import alert_service
from app.utils.responses import success_response

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("")
async def list_alerts(db: AsyncIOMotorDatabase = Depends(get_database), current_user: dict = Depends(get_current_user)):
    data = await alert_service.list_alerts(db)
    return success_response(data=data)


@router.post("/sos")
@limiter.limit("20/minute")
async def sos(
    request: Request,
    payload: SOSRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    data = await alert_service.trigger_sos(db, current_user, payload.action, payload.lat, payload.lng)
    return success_response(data=data, message="SOS action processed")
