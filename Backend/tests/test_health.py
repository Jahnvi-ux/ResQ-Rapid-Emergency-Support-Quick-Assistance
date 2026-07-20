import pytest


@pytest.mark.asyncio
async def test_health_check(client):
    async with client as c:
        response = await c.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["status"] == "healthy"
