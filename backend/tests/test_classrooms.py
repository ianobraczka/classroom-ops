from uuid import UUID

import pytest
from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AuditLog


async def count_audit(session: AsyncSession, entity_id: UUID) -> int:
    q = await session.execute(select(func.count()).select_from(AuditLog).where(AuditLog.entity_id == entity_id))
    return int(q.scalar_one() or 0)


@pytest.mark.asyncio
async def test_create_classroom_writes_audit(
    client: AsyncClient,
    teacher,
    db_session: AsyncSession,
) -> None:
    headers = {"X-User-Id": str(teacher.id)}
    payload = {
        "name": "Algebra I",
        "description": "Morning section",
        "subject": "Math",
        "grade_level": "9",
        "academic_year": "2025-2026",
    }
    res = await client.post("/classrooms", json=payload, headers=headers)
    assert res.status_code == 201
    body = res.json()
    cid = UUID(body["id"])
    assert body["owner_id"] == str(teacher.id)
    assert body["status"] == "active"

    n = await count_audit(db_session, cid)
    assert n >= 1


@pytest.mark.asyncio
async def test_update_requires_ownership(
    client: AsyncClient,
    teacher,
    other_teacher,
) -> None:
    headers_owner = {"X-User-Id": str(teacher.id)}
    create = await client.post(
        "/classrooms",
        json={"name": "Physics"},
        headers=headers_owner,
    )
    cid = create.json()["id"]

    bad = await client.patch(
        f"/classrooms/{cid}",
        json={"name": "Hacked"},
        headers={"X-User-Id": str(other_teacher.id)},
    )
    assert bad.status_code == 403

    ok = await client.patch(
        f"/classrooms/{cid}",
        json={"name": "AP Physics"},
        headers=headers_owner,
    )
    assert ok.status_code == 200
    assert ok.json()["name"] == "AP Physics"


@pytest.mark.asyncio
async def test_archive_excludes_from_list(
    client: AsyncClient,
    teacher,
) -> None:
    headers = {"X-User-Id": str(teacher.id)}
    await client.post("/classrooms", json={"name": "Active Room"}, headers=headers)
    b = await client.post("/classrooms", json={"name": "To Archive"}, headers=headers)
    bid = b.json()["id"]

    arch = await client.post(f"/classrooms/{bid}/archive", headers=headers)
    assert arch.status_code == 200
    assert arch.json()["status"] == "archived"
    assert arch.json()["archived_at"] is not None

    listed = await client.get("/classrooms", headers=headers)
    names = {row["name"] for row in listed.json()}
    assert "Active Room" in names
    assert "To Archive" not in names


@pytest.mark.asyncio
async def test_archive_forbidden_for_non_owner(
    client: AsyncClient,
    teacher,
    other_teacher,
) -> None:
    create = await client.post(
        "/classrooms",
        json={"name": "Owned"},
        headers={"X-User-Id": str(teacher.id)},
    )
    cid = create.json()["id"]
    res = await client.post(
        f"/classrooms/{cid}/archive",
        headers={"X-User-Id": str(other_teacher.id)},
    )
    assert res.status_code == 403
