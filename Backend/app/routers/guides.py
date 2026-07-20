from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.core.dependencies import get_current_user
from app.services import guide_service
from app.utils.responses import success_response

router = APIRouter(prefix="/guides", tags=["Emergency Guide"])


@router.get("")
async def list_guides(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    data = await guide_service.list_guides(db)
    return success_response(data=data)


@router.get("/search")
async def search_guides(
    q: str = Query(min_length=1),
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    data = await guide_service.search_guides(db, q)
    return success_response(data=data)


@router.get("/{category}")
async def get_guide(
    category: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    data = await guide_service.get_guide(db, category)
    if not data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Guide category not found")
    return success_response(data=data)
