from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import User
from app.schemas.classroom import ClassroomCreate, ClassroomRead, ClassroomUpdate
from app.services.classroom_service import ClassroomService

router = APIRouter(prefix="/classrooms", tags=["classrooms"])


@router.post("", response_model=ClassroomRead, status_code=201)
async def create_classroom(
    payload: ClassroomCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> ClassroomRead:
    service = ClassroomService(session)
    classroom = await service.create_classroom(owner_id=current_user.id, data=payload)
    return ClassroomRead.model_validate(classroom)


@router.get("", response_model=list[ClassroomRead])
async def list_classrooms(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[ClassroomRead]:
    service = ClassroomService(session)
    rows = await service.list_classrooms(owner_id=current_user.id)
    return [ClassroomRead.model_validate(r) for r in rows]


@router.get("/{classroom_id}", response_model=ClassroomRead)
async def get_classroom(
    classroom_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> ClassroomRead:
    service = ClassroomService(session)
    classroom = await service.get_classroom(classroom_id=classroom_id, requester_id=current_user.id)
    return ClassroomRead.model_validate(classroom)


@router.patch("/{classroom_id}", response_model=ClassroomRead)
async def update_classroom(
    classroom_id: UUID,
    payload: ClassroomUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> ClassroomRead:
    service = ClassroomService(session)
    classroom = await service.update_classroom(
        classroom_id=classroom_id,
        requester_id=current_user.id,
        data=payload,
    )
    return ClassroomRead.model_validate(classroom)


@router.post("/{classroom_id}/archive", response_model=ClassroomRead)
async def archive_classroom(
    classroom_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> ClassroomRead:
    service = ClassroomService(session)
    classroom = await service.archive_classroom(classroom_id=classroom_id, requester_id=current_user.id)
    return ClassroomRead.model_validate(classroom)
