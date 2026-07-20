"""
Mongo document shape for the `users` collection.
This is a construction helper, not a validation layer — validation
happens in schemas/ before data ever reaches here.
"""
from datetime import datetime, timezone
from typing import Any


def new_user_document(
    name: str,
    email: str,
    hashed_password: str | None,
    phone: str = "",
    auth_provider: str = "local",
) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    return {
        "name": name,
        "email": email.lower(),
        "hashed_password": hashed_password,
        "phone": phone,
        "address": "",
        "age": None,
        "gender": "",
        "blood_group": "",
        "medical_conditions": "",
        "emergency_contact": {"name": "", "phone": "", "relation": ""},
        "language": "English",
        "avatar_url": "",
        "role": "user",
        "auth_provider": auth_provider,  # "local" | "google"
        "is_active": True,
        "is_verified": False,
        "checklist_state": [],  # indices of completed emergency-guide checklist items
        "created_at": now,
        "updated_at": now,
    }
