from fastapi import APIRouter, Depends, Request
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.core.dependencies import get_current_user, limiter
from app.schemas.auth import (
    ForgotPasswordRequest,
    GoogleLoginRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    UserPublic,
)
from app.services import auth_service
from app.utils.responses import success_response

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _to_public_user(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "phone": user.get("phone", ""),
        "role": user.get("role", "user"),
        "is_verified": user.get("is_verified", False),
        "avatar_url": user.get("avatar_url", ""),
    }


@router.post("/register", status_code=201)
@limiter.limit("10/minute")
async def register(request: Request, payload: RegisterRequest, db: AsyncIOMotorDatabase = Depends(get_database)):
    user = await auth_service.register_user(db, payload)
    tokens = await auth_service.issue_token_pair(db, str(user["_id"]))
    return success_response(
        data={"user": _to_public_user(user), "tokens": tokens.model_dump()},
        message="Account created successfully",
        status_code=201,
    )


@router.post("/login")
@limiter.limit("10/minute")
async def login(request: Request, payload: LoginRequest, db: AsyncIOMotorDatabase = Depends(get_database)):
    user = await auth_service.authenticate_user(db, payload)
    tokens = await auth_service.issue_token_pair(db, str(user["_id"]), remember_me=payload.remember_me)
    return success_response(
        data={"user": _to_public_user(user), "tokens": tokens.model_dump()},
        message="Logged in successfully",
    )


@router.post("/google")
@limiter.limit("10/minute")
async def google_login(request: Request, payload: GoogleLoginRequest, db: AsyncIOMotorDatabase = Depends(get_database)):
    user = await auth_service.authenticate_google_user(db, payload.id_token)
    tokens = await auth_service.issue_token_pair(db, str(user["_id"]))
    return success_response(data={"user": _to_public_user(user), "tokens": tokens.model_dump()})


@router.post("/refresh")
async def refresh(payload: RefreshRequest, db: AsyncIOMotorDatabase = Depends(get_database)):
    tokens = await auth_service.refresh_access_token(db, payload.refresh_token)
    return success_response(data=tokens.model_dump(), message="Token refreshed")


@router.post("/logout")
async def logout(payload: RefreshRequest, db: AsyncIOMotorDatabase = Depends(get_database)):
    await auth_service.revoke_refresh_token(db, payload.refresh_token)
    return success_response(message="Logged out successfully")


@router.post("/forgot-password")
@limiter.limit("5/minute")
async def forgot_password(request: Request, payload: ForgotPasswordRequest, db: AsyncIOMotorDatabase = Depends(get_database)):
    await auth_service.request_password_reset(db, payload.email)
    return success_response(message="If that email exists, a reset link has been sent")


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, db: AsyncIOMotorDatabase = Depends(get_database)):
    await auth_service.reset_password(db, payload.token, payload.new_password)
    return success_response(message="Password reset successfully")


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    return success_response(data=_to_public_user(current_user))
