"""Seed demo users (idempotent). Run after migrations."""

import asyncio
from uuid import UUID

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models import User
from app.models.enums import UserRole

SEED_USERS: list[dict] = [
    {
        "id": UUID("11111111-1111-1111-1111-111111111101"),
        "email": "teacher@example.com",
        "full_name": "Taylor Teacher",
        "role": UserRole.teacher,
    },
    {
        "id": UUID("11111111-1111-1111-1111-111111111102"),
        "email": "student@example.com",
        "full_name": "Sam Student",
        "role": UserRole.student,
    },
    {
        "id": UUID("11111111-1111-1111-1111-111111111103"),
        "email": "admin@example.com",
        "full_name": "Alex Admin",
        "role": UserRole.admin,
    },
]


async def seed() -> None:
    async with AsyncSessionLocal() as session:
        existing = await session.execute(select(User).limit(1))
        if existing.scalar_one_or_none() is not None:
            return

        for row in SEED_USERS:
            session.add(
                User(
                    id=row["id"],
                    email=row["email"],
                    full_name=row["full_name"],
                    role=row["role"],
                )
            )
        await session.commit()


def main() -> None:
    asyncio.run(seed())


if __name__ == "__main__":
    main()
