"""Accounts and authentication HTTP API."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.identity.deps import get_current_account
from app.modules.identity.models import Account
from app.modules.identity.schemas import (
    AccountResponse,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
)
from app.modules.identity.service import IdentityService

router = APIRouter()


@router.get("/health")
async def health() -> dict[str, str]:
    return {"module": "identity", "status": "ok"}


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(
    body: RegisterRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    return await IdentityService(db).register(email=body.email, password=body.password)


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    return await IdentityService(db).login(email=body.email, password=body.password)


@router.get("/me", response_model=AccountResponse)
async def me(account: Annotated[Account, Depends(get_current_account)]) -> AccountResponse:
    return IdentityService.to_response(account)
