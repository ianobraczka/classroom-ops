import os
import tempfile

os.environ["PYTEST_RUNNING"] = "1"

if "DATABASE_URL" not in os.environ:
    test_url = os.environ.get("TEST_DATABASE_URL")
    if test_url:
        os.environ["DATABASE_URL"] = test_url
    else:
        _fd, _path = tempfile.mkstemp(prefix="cop_pytest_", suffix=".db")
        os.close(_fd)
        os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{_path}"

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID, uuid4

from app.core.database import AsyncSessionLocal, engine
from app.main import app
from app.models import AuditLog, Base, Classroom, User
from app.models.enums import UserRole

pytestmark = pytest.mark.asyncio


@pytest_asyncio.fixture(scope="session", autouse=True)
async def prepare_schema() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield


@pytest_asyncio.fixture(autouse=True)
async def clean_tables(prepare_schema: None) -> None:
    async with AsyncSessionLocal() as session:
        await session.execute(delete(AuditLog))
        await session.execute(delete(Classroom))
        await session.execute(delete(User))
        await session.commit()
    yield


async def create_user(session: AsyncSession, *, role: UserRole = UserRole.teacher) -> User:
    u = User(
        id=uuid4(),
        email=f"{uuid4().hex[:10]}@example.com",
        full_name="Test User",
        role=role,
    )
    session.add(u)
    await session.commit()
    await session.refresh(u)
    return u


@pytest_asyncio.fixture
async def db_session() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def teacher(db_session: AsyncSession) -> User:
    return await create_user(db_session, role=UserRole.teacher)


@pytest_asyncio.fixture
async def other_teacher(db_session: AsyncSession) -> User:
    return await create_user(db_session, role=UserRole.teacher)


@pytest_asyncio.fixture
async def client() -> AsyncClient:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
