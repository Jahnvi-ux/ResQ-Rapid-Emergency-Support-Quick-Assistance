from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.core.dependencies import get_current_user
from app.schemas.user import ChecklistUpdateRequest, UserProfileUpdateRequest
from app.services import user_service
from app.utils.responses import success_response

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    return success_response(data=user_service.to_profile_response(current_user))


@router.put("/me")
async def update_my_profile(
    payload: UserProfileUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    updated = await user_service.update_profile(db, current_user["_id"], payload)
    return success_response(data=user_service.to_profile_response(updated), message="Profile updated")


@router.get("/me/checklist")
async def get_checklist(current_user: dict = Depends(get_current_user)):
    return success_response(data={"completed_indices": current_user.get("checklist_state", [])})


@router.put("/me/checklist")
async def update_checklist(
    payload: ChecklistUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    result = await user_service.update_checklist(db, current_user["_id"], payload.completed_indices)
    return success_response(data={"completed_indices": result}, message="Checklist updated")
