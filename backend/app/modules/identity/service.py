"""Identity application services."""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password, verify_password
from app.modules.identity.models import Account
from app.modules.identity.schemas import AccountResponse, TokenResponse


class IdentityService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def register(self, *, email: str, password: str) -> TokenResponse:
        existing = await self._db.scalar(select(Account).where(Account.email == email.lower()))
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An Account with this email already exists",
            )

        account = Account(email=email.lower(), password_hash=hash_password(password))
        self._db.add(account)
        await self._db.commit()
        await self._db.refresh(account)
        return TokenResponse(access_token=create_access_token(account_id=account.id, email=account.email))

    async def login(self, *, email: str, password: str) -> TokenResponse:
        account = await self._db.scalar(select(Account).where(Account.email == email.lower()))
        if account is None or not verify_password(password, account.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        return TokenResponse(access_token=create_access_token(account_id=account.id, email=account.email))

    async def get_by_id(self, account_id: UUID) -> Account:
        account = await self._db.get(Account, account_id)
        if account is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account not found")
        return account

    @staticmethod
    def to_response(account: Account) -> AccountResponse:
        return AccountResponse.model_validate(account)
