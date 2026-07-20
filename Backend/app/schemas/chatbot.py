from typing import Optional

from pydantic import BaseModel, Field


class ChatMessageRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    # Optional base64 data URL (e.g. "data:image/png;base64,....") sent when the
    # user attaches a photo in the chatbot. Leave empty/None for normal text/mic messages.
    image_base64: Optional[str] = None
    # Optional BCP-47 language code (e.g. "hi-IN", "ta-IN") captured from the mic
    # language selector, so the AI reply can match the language the user spoke in.
    language: Optional[str] = None
    # Optional coordinates (from the browser's geolocation) so the AI reply
    # can be grounded in the user's actual current weather conditions.
    lat: Optional[float] = None
    lng: Optional[float] = None


class ChatMessageResponse(BaseModel):
    reply: str
    conversation_id: str


class ChatHistoryItem(BaseModel):
    role: str  # "user" | "bot"
    message: str
    created_at: str
