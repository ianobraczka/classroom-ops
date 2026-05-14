from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.enums import ClassroomStatus


class Classroom(Base):
    __tablename__ = "classrooms"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    subject: Mapped[str | None] = mapped_column(String(255), nullable=True)
    grade_level: Mapped[str | None] = mapped_column(String(64), nullable=True)
    academic_year: Mapped[str | None] = mapped_column(String(32), nullable=True)
    status: Mapped[ClassroomStatus] = mapped_column(
        SAEnum(ClassroomStatus, native_enum=False, length=32),
        default=ClassroomStatus.active,
        nullable=False,
    )
    owner_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    owner = relationship("User", back_populates="classrooms_owned")
