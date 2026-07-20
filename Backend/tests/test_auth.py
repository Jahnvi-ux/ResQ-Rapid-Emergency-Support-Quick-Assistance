import pytest


@pytest.mark.asyncio
async def test_register_and_login_flow(client):
    async with client as c:
        register_payload = {
            "name": "Reeya Sharma",
            "email": "reeya@example.com",
            "password": "supersecret123",
            "phone": "+919876543210",
        }
        r = await c.post("/api/v1/auth/register", json=register_payload)
        assert r.status_code == 201
        body = r.json()
        assert body["success"] is True
        assert body["data"]["user"]["email"] == "reeya@example.com"
        access_token = body["data"]["tokens"]["access_token"]
        refresh_token = body["data"]["tokens"]["refresh_token"]

        # Duplicate registration should fail
        r_dup = await c.post("/api/v1/auth/register", json=register_payload)
        assert r_dup.status_code == 409

        # Wrong password
        r_bad = await c.post(
            "/api/v1/auth/login", json={"email": "reeya@example.com", "password": "wrongpass", "remember_me": False}
        )
        assert r_bad.status_code == 401

        # Correct login
        r_login = await c.post(
            "/api/v1/auth/login",
            json={"email": "reeya@example.com", "password": "supersecret123", "remember_me": True},
        )
        assert r_login.status_code == 200

        # Protected route without token
        r_no_auth = await c.get("/api/v1/auth/me")
        assert r_no_auth.status_code == 401

        # Protected route with token
        r_me = await c.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"})
        assert r_me.status_code == 200
        assert r_me.json()["data"]["email"] == "reeya@example.com"

        # Refresh token rotation
        r_refresh = await c.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
        assert r_refresh.status_code == 200
        new_refresh_token = r_refresh.json()["data"]["refresh_token"]
        assert new_refresh_token != refresh_token

        # Old refresh token should now be revoked
        r_refresh_again = await c.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
        assert r_refresh_again.status_code == 401

        # Logout with the still-valid refresh token
        r_logout = await c.post("/api/v1/auth/logout", json={"refresh_token": new_refresh_token})
        assert r_logout.status_code == 200
