"""
Image analysis provider abstraction.

`ImageAnalysisProvider` is the contract. `MockImageAnalysisProvider`
returns a realistic canned result until a real model/API key is
configured — swapping in YOLO, TensorFlow, Gemini Vision, or OpenAI
Vision later means adding one class and updating `get_image_provider()`.
"""
import os
import uuid
from abc import ABC, abstractmethod
from datetime import datetime, timezone

from fastapi import HTTPException, UploadFile, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings


class ImageAnalysisProvider(ABC):
    @abstractmethod
    async def analyze(self, file_path: str) -> dict: ...


class MockImageAnalysisProvider(ImageAnalysisProvider):
    async def analyze(self, file_path: str) -> dict:
        return {
            "disaster_type": "Flood",
            "confidence_pct": 87,
            "summary": "Standing water covers a residential street with partial submersion of ground-floor entryways. Conditions are consistent with localized urban flooding.",
            "first_aid_suggestion": "If anyone nearby shows signs of injury from debris, apply firm pressure to wounds and avoid moving anyone with a suspected fracture.",
            "recommended_action": "Evacuate ground-floor areas and move to higher ground. Avoid contact with floodwater near electrical lines.",
            "risk_level": "Medium",
        }


def get_image_provider() -> ImageAnalysisProvider:
    if settings.GEMINI_API_KEY:
        # TODO: return GeminiVisionProvider() once implemented.
        pass
    if settings.OPENAI_API_KEY:
        # TODO: return OpenAIVisionProvider() once implemented.
        pass
    return MockImageAnalysisProvider()


async def save_upload(file: UploadFile) -> str:
    if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Unsupported image type")

    contents = await file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "Image exceeds size limit")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename or "")[1] or ".jpg"
    safe_name = f"{uuid.uuid4()}{ext}"
    path = os.path.join(settings.UPLOAD_DIR, safe_name)
    with open(path, "wb") as f:
        f.write(contents)
    return path


async def analyze_and_store(db: AsyncIOMotorDatabase, user_id: str, file: UploadFile) -> dict:
    from bson import ObjectId

    path = await save_upload(file)
    result = await get_image_provider().analyze(path)

    doc = {
        "user_id": ObjectId(user_id),
        "file_path": path,
        "original_filename": file.filename,
        "content_type": file.content_type,
        "result": result,
        "created_at": datetime.now(timezone.utc),
    }
    inserted = await db.uploads.insert_one(doc)
    return {"upload_id": str(inserted.inserted_id), **result}
