from bson import ObjectId
from fastapi import APIRouter, Depends, File, Request, UploadFile
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.core.dependencies import get_current_user, limiter
from app.services import image_service
from app.utils.responses import success_response

router = APIRouter(prefix="/uploads", tags=["Image Upload"])


@router.post("/analyze")
@limiter.limit("15/minute")
async def analyze_image(
    request: Request,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    data = await image_service.analyze_and_store(db, current_user["_id"], file)
    return success_response(data=data, message="Image analyzed successfully")


@router.get("/history")
async def upload_history(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    cursor = db.uploads.find({"user_id": ObjectId(current_user["_id"])}).sort("created_at", -1).limit(20)
    data = [
        {
            "id": str(doc["_id"]),
            "original_filename": doc["original_filename"],
            "result": doc["result"],
            "created_at": doc["created_at"].isoformat(),
        }
        async for doc in cursor
    ]
    return success_response(data=data)
