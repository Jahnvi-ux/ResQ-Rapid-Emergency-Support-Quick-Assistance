from fastapi import APIRouter, Depends, Request
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.core.dependencies import get_current_user, limiter
from app.schemas.chatbot import ChatMessageRequest
from app.services import chat_service
from app.utils.responses import success_response

router = APIRouter(prefix="/chatbot", tags=["AI Chatbot"])


@router.post("/message")
@limiter.limit("30/minute")
async def send_message(
    request: Request,
    payload: ChatMessageRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    reply = await chat_service.send_message(
        db,
        current_user["_id"],
        payload.message,
        image_base64=payload.image_base64,
        language=payload.language,
        lat=payload.lat,
        lng=payload.lng,
    )
    return success_response(data={"reply": reply, "conversation_id": current_user["_id"]})


@router.get("/history")
async def history(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    data = await chat_service.get_history(db, current_user["_id"])
    return success_response(data=data)


@router.delete("/history")
async def clear_history(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    await chat_service.clear_history(db, current_user["_id"])
    return success_response(message="Chat history cleared")
