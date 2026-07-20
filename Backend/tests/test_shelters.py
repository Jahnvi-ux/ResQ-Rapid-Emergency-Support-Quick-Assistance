import pytest

from app.services.shelter_service import seed_shelters_if_empty


@pytest.mark.asyncio
async def test_nearby_shelters_requires_auth(client):
    async with client as c:
        r = await c.get("/api/v1/shelters/nearby", params={"lat": 26.91, "lng": 75.78})
        assert r.status_code == 401


@pytest.mark.asyncio
async def test_nearby_shelters_authenticated(client, mock_db):
    await seed_shelters_if_empty(mock_db)
    async with client as c:
        register = await c.post(
            "/api/v1/auth/register",
            json={"name": "Test User", "email": "test@example.com", "password": "password123"},
        )
        token = register.json()["data"]["tokens"]["access_token"]

        r = await c.get(
            "/api/v1/shelters/nearby",
            params={"lat": 26.9124, "lng": 75.7873, "radius_km": 50},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert r.status_code == 200
        data = r.json()["data"]
        assert isinstance(data, list)
        assert len(data) > 0
        assert "distance_km" in data[0]
