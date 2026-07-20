"""Shared schema primitives used across multiple domains."""
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, GetCoreSchemaHandler
from pydantic_core import core_schema
from bson import ObjectId


class PyObjectId(str):
    """Allows Mongo's ObjectId to be validated/serialized as a plain string."""

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type: Any, handler: GetCoreSchemaHandler) -> core_schema.CoreSchema:
        return core_schema.no_info_after_validator_function(cls.validate, core_schema.str_schema())

    @classmethod
    def validate(cls, value: Any) -> str:
        if isinstance(value, ObjectId):
            return str(value)
        if isinstance(value, str) and ObjectId.is_valid(value):
            return value
        raise ValueError("Invalid ObjectId")


T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "OK"
    data: T | None = None


class Coordinates(BaseModel):
    lat: float
    lng: float
