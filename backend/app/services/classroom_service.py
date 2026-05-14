from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Classroom
from app.models.enums import ClassroomStatus
from app.repositories.audit_log_repository import AuditLogRepository
from app.repositories.classroom_repository import ClassroomRepository
from app.schemas.classroom import ClassroomCreate, ClassroomUpdate


class ClassroomService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._classrooms = ClassroomRepository(session)
        self._audit = AuditLogRepository(session)

    async def create_classroom(self, *, owner_id: UUID, data: ClassroomCreate) -> Classroom:
        now = datetime.now(UTC)
        classroom = Classroom(
            name=data.name,
            description=data.description,
            subject=data.subject,
            grade_level=data.grade_level,
            academic_year=data.academic_year,
            status=ClassroomStatus.active,
            owner_id=owner_id,
            updated_at=now,
        )
        created = await self._classrooms.create(classroom)
        await self._audit.create(
            actor_user_id=owner_id,
            entity_type="classroom",
            entity_id=created.id,
            action="create",
            meta={"payload": data.model_dump()},
        )
        await self._session.commit()
        await self._session.refresh(created)
        return created

    async def list_classrooms(self, *, owner_id: UUID) -> list[Classroom]:
        return await self._classrooms.list_active_for_owner(owner_id)

    async def get_classroom(self, *, classroom_id: UUID, requester_id: UUID) -> Classroom:
        classroom = await self._classrooms.get_by_id(classroom_id)
        if classroom is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")
        if classroom.owner_id != requester_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
        return classroom

    async def update_classroom(
        self,
        *,
        classroom_id: UUID,
        requester_id: UUID,
        data: ClassroomUpdate,
    ) -> Classroom:
        classroom = await self._classrooms.get_by_id(classroom_id)
        if classroom is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")
        if classroom.owner_id != requester_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
        if classroom.status != ClassroomStatus.active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot update archived classroom")

        patch = data.model_dump(exclude_unset=True)
        if not patch:
            return classroom

        now = datetime.now(UTC)
        for field, value in patch.items():
            setattr(classroom, field, value)
        classroom.updated_at = now

        updated = await self._classrooms.save(classroom)
        await self._audit.create(
            actor_user_id=requester_id,
            entity_type="classroom",
            entity_id=updated.id,
            action="update",
            meta={"changes": patch},
        )
        await self._session.commit()
        await self._session.refresh(updated)
        return updated

    async def archive_classroom(self, *, classroom_id: UUID, requester_id: UUID) -> Classroom:
        classroom = await self._classrooms.get_by_id(classroom_id)
        if classroom is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")
        if classroom.owner_id != requester_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
        if classroom.status == ClassroomStatus.archived:
            return classroom

        now = datetime.now(UTC)
        classroom.status = ClassroomStatus.archived
        classroom.archived_at = now
        classroom.updated_at = now

        archived = await self._classrooms.save(classroom)
        await self._audit.create(
            actor_user_id=requester_id,
            entity_type="classroom",
            entity_id=archived.id,
            action="archive",
            meta={},
        )
        await self._session.commit()
        await self._session.refresh(archived)
        return archived
