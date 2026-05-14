from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserRead

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserRead])
async def list_users(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[UserRead]:
    """List users for mock login selection (intentionally unauthenticated for local/demo use)."""
    repo = UserRepository(session)
    users = await repo.list_all()
    return [UserRead.model_validate(u) for u in users]
