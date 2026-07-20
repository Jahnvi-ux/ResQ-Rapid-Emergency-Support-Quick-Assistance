from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.core.database import get_database
from app.core.dependencies import get_current_user
from app.utils.responses import success_response

router = APIRouter(prefix="/emergency-contacts", tags=["Emergency Contacts"])


class EmergencyContactRequest(BaseModel):
    name: str
    phone: str
    relation: str = ""
    email: str = ""


def _serialize(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "phone": doc["phone"],
        "relation": doc.get("relation", ""),
        "email": doc.get("email", ""),
    }


@router.get("")
async def list_contacts(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_database)):
    cursor = db.emergency_contacts.find({"user_id": ObjectId(current_user["_id"])})
    data = [_serialize(doc) async for doc in cursor]
    return success_response(data=data)


@router.post("", status_code=201)
async def add_contact(
    payload: EmergencyContactRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    doc = {
        "user_id": ObjectId(current_user["_id"]),
        "name": payload.name,
        "phone": payload.phone,
        "relation": payload.relation,
        "email": payload.email,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.emergency_contacts.insert_one(doc)
    doc["_id"] = result.inserted_id
    return success_response(data=_serialize(doc), message="Emergency contact added", status_code=201)


@router.delete("/{contact_id}")
async def delete_contact(
    contact_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    result = await db.emergency_contacts.delete_one(
        {"_id": ObjectId(contact_id), "user_id": ObjectId(current_user["_id"])}
    )
    if result.deleted_count == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Contact not found")
    return success_response(message="Emergency contact removed")
