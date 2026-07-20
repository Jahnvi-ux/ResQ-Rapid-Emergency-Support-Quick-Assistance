import pytest
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

from app.core.database import get_database
from app.main import app


@pytest.fixture
def mock_db():
    client = AsyncMongoMockClient()
    return client["resq_test"]


@pytest.fixture
def client(mock_db):
    app.dependency_overrides[get_database] = lambda: mock_db
    transport = ASGITransport(app=app)
    yield AsyncClient(transport=transport, base_url="http://test")
    app.dependency_overrides.clear()
