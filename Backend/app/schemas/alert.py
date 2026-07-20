from pydantic import BaseModel


class AlertOut(BaseModel):
    id: str
    title: str
    severity: str
    description: str
    created_at: str


class SOSRequest(BaseModel):
    lat: float | None = None
    lng: float | None = None
    action: str  # "call" | "share_location" | "notify_contacts" | "find_shelter"


class NotificationOut(BaseModel):
    id: str
    title: str
    body: str
    read: bool
    created_at: str
