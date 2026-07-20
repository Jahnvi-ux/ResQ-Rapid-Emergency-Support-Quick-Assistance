"""
Reusable FastAPI dependencies: JWT auth guard, current-user loader,
role-based guard, and the shared SlowAPI rate limiter instance.
"""
from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorDatabase
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.database import get_database
from app.core.security import decode_token

limiter = Limiter(key_func=get_remote_address)

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> dict:
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")

    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")

    user_id = payload.get("sub")
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User no longer exists")
    if user.get("is_active") is False:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account is deactivated")

    user["_id"] = str(user["_id"])
    return user


def require_role(*allowed_roles: str):
    """Role-based guard factory, e.g. Depends(require_role('admin'))."""

    async def _guard(user: dict = Depends(get_current_user)) -> dict:
        if user.get("role", "user") not in allowed_roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient permissions")
        return user

    return _guard
