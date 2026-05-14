from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Classroom
from app.models.enums import ClassroomStatus


class ClassroomRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, classroom: Classroom) -> Classroom:
        self._session.add(classroom)
        await self._session.flush()
        await self._session.refresh(classroom)
        return classroom

    async def get_by_id(self, classroom_id: UUID) -> Classroom | None:
        stmt = select(Classroom).where(Classroom.id == classroom_id)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_active_for_owner(self, owner_id: UUID) -> list[Classroom]:
        stmt = (
            select(Classroom)
            .where(
                Classroom.owner_id == owner_id,
                Classroom.status == ClassroomStatus.active,
            )
            .order_by(Classroom.created_at.desc())
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def save(self, classroom: Classroom) -> Classroom:
        self._session.add(classroom)
        await self._session.flush()
        await self._session.refresh(classroom)
        return classroom
