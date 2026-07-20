from pydantic import BaseModel, EmailStr


class EmergencyContact(BaseModel):
    name: str = ""
    phone: str = ""
    relation: str = ""


class UserProfileResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    phone: str
    address: str
    age: int | None = None
    gender: str
    blood_group: str
    medical_conditions: str
    emergency_contact: EmergencyContact
    language: str
    avatar_url: str
    is_verified: bool


class UserProfileUpdateRequest(BaseModel):
    name: str | None = None
    phone: str | None = None
    address: str | None = None
    age: int | None = None
    gender: str | None = None
    blood_group: str | None = None
    medical_conditions: str | None = None
    emergency_contact: EmergencyContact | None = None
    language: str | None = None
    avatar_url: str | None = None


class ChecklistUpdateRequest(BaseModel):
    completed_indices: list[int]
