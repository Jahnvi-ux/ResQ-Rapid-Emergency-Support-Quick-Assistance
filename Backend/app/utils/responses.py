"""
Standard response envelope: every endpoint returns
{ "success": bool, "message": str, "data": Any }.
"""
from typing import Any

from fastapi.responses import JSONResponse


def success_response(data: Any = None, message: str = "OK", status_code: int = 200) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"success": True, "message": message, "data": data},
    )


def error_response(message: str = "Something went wrong", status_code: int = 400, data: Any = None) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "message": message, "data": data},
    )
