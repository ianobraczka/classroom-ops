from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AuditLog


class AuditLogRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        *,
        actor_user_id: UUID,
        entity_type: str,
        entity_id: UUID,
        action: str,
        meta: dict | None = None,
    ) -> AuditLog:
        row = AuditLog(
            actor_user_id=actor_user_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            metadata_=meta or {},
        )
        self._session.add(row)
        await self._session.flush()
        return row

    async def list_for_entity(self, entity_type: str, entity_id: UUID) -> list[AuditLog]:
        stmt = (
            select(AuditLog)
            .where(AuditLog.entity_type == entity_type, AuditLog.entity_id == entity_id)
            .order_by(AuditLog.created_at.desc())
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())
