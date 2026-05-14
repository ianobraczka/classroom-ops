from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ClassroomStatus


class ClassroomCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(None, max_length=2000)
    subject: str | None = Field(None, max_length=255)
    grade_level: str | None = Field(None, max_length=64)
    academic_year: str | None = Field(None, max_length=32)


class ClassroomUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = Field(None, max_length=2000)
    subject: str | None = Field(None, max_length=255)
    grade_level: str | None = Field(None, max_length=64)
    academic_year: str | None = Field(None, max_length=32)


class ClassroomRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str | None
    subject: str | None
    grade_level: str | None
    academic_year: str | None
    status: ClassroomStatus
    owner_id: UUID
    created_at: datetime
    updated_at: datetime
    archived_at: datetime | None
