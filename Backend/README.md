# ResQ Backend

FastAPI + MongoDB backend for the ResQ disaster-response frontend. Built to match the existing frontend exactly — no UI changes were made to ship this.

## Stack

Python 3.12 · FastAPI · MongoDB (Motor, async) · JWT (access + refresh) · Passlib/bcrypt · Pydantic v2 · Loguru · SlowAPI (rate limiting) · Pytest

## Quick start

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # then edit JWT_SECRET_KEY, MONGO_URI, CORS_ORIGINS
# Requires a running MongoDB instance (local or Atlas) at MONGO_URI

uvicorn app.main:app --reload --port 8000
```

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health check: `http://localhost:8000/health`

On first startup the app seeds `shelters`, `emergency_services`, `emergency_guides`, and `alerts` with realistic mock data so the frontend has something real to render immediately — safe to run repeatedly, it only seeds empty collections.

## Running tests

```bash
pytest
```

Tests run against `mongomock-motor`, so no real MongoDB connection is needed for the test suite.

## Project layout

```
app/
  main.py            # FastAPI app, lifespan (Mongo connect + seed), CORS, routers
  core/
    config.py         # Settings (env-driven)
    database.py        # Motor client + index setup
    security.py         # Password hashing, JWT creation/verification
    dependencies.py      # get_current_user, require_role, rate limiter
  models/             # Mongo document shape helpers + seed data
  schemas/            # Pydantic request/response DTOs
  services/           # Business logic + provider abstractions
  routers/            # Thin HTTP layer per domain
  middleware/         # Request logging, global error handling
  utils/              # Response envelope, geo helpers
tests/                # Pytest suite (mongomock-backed)
```

## API response format

Every endpoint returns the same envelope:

```json
{ "success": true, "message": "...", "data": { } }
```

Errors (4xx/5xx) use the same shape with `"success": false`.

## Auth flow

1. `POST /api/v1/auth/register` or `/auth/login` → returns `{ user, tokens: { access_token, refresh_token, expires_in } }`.
2. Frontend stores both tokens (see `js/api.js` — access token in memory + localStorage, refresh token in localStorage).
3. Every protected request sends `Authorization: Bearer <access_token>`.
4. On a `401`, the frontend calls `POST /auth/refresh` with the refresh token, gets a **new** token pair (refresh tokens are rotated — the old one is revoked on use), and retries the original request once.
5. `POST /auth/logout` revokes the current refresh token.

`remember_me` at login extends the refresh token lifetime from 7 to 30 days (see `.env`).

## Collections

`users`, `emergency_contacts`, `shelters`, `emergency_services`, `alerts`, `notifications`, `weather_cache`, `emergency_guides`, `chat_history`, `uploads`, `refresh_tokens`, `sos_events`.

## Endpoints

| Domain | Routes |
|---|---|
| Auth | `POST /auth/register`, `/login`, `/google`, `/refresh`, `/logout`, `/forgot-password`, `/reset-password`, `GET /auth/me` |
| Users | `GET/PUT /users/me`, `GET/PUT /users/me/checklist` |
| Dashboard | `GET /dashboard/summary` (aggregated: weather, risk, shelters, services, alerts, notifications, stats, AI recommendations) |
| Weather | `GET /weather/current`, `/forecast`, `/alerts` |
| Shelters | `GET /shelters/nearby` (geospatial, filterable by status/capacity) |
| Emergency Services | `GET /emergency-services/nearby` (geospatial, filterable by type) |
| Emergency Contacts | `GET/POST /emergency-contacts`, `DELETE /emergency-contacts/{id}` |
| Chatbot | `POST /chatbot/message`, `GET/DELETE /chatbot/history` |
| Uploads | `POST /uploads/analyze` (multipart), `GET /uploads/history` |
| Guides | `GET /guides`, `GET /guides/search?q=`, `GET /guides/{category}` |
| Alerts | `GET /alerts`, `POST /alerts/sos` |
| Notifications | `GET /notifications`, `PUT /notifications/{id}/read`, `PUT /notifications/read-all` |

## Provider abstractions (mock today, pluggable tomorrow)

- **`services/weather_service.py`** — `WeatherProvider` ABC, `MockWeatherProvider` active. Add `OpenWeatherMapProvider`/`WeatherAPIProvider`/etc. and flip the branch in `get_weather_provider()`.
- **`services/ai_service.py`** — `AIProvider` ABC, `MockAIProvider` active (keyword-matched replies). Add `GeminiProvider`/`OpenAIProvider`/`ClaudeProvider` and flip `get_ai_provider()`.
- **`services/image_service.py`** — `ImageAnalysisProvider` ABC, `MockImageAnalysisProvider` active. Add YOLO/TensorFlow/Vision-API providers and flip `get_image_provider()`.

No router or frontend code needs to change when a real provider is added — only the service-layer branch.

## Not yet wired to a real provider (architecture only)

- Google login (`POST /auth/google`) returns `501` until `GOOGLE_CLIENT_ID` is set and token verification is implemented.
- Forgot-password emails log the reset token instead of sending until `SMTP_*` is set.
- SOS "notify contacts" logs the event and counts contacts; actual SMS send is gated behind `SMS_PROVIDER_API_KEY`.

## Security

JWT access (30 min) + refresh (7 or 30 days, rotated on use, revocable), bcrypt password hashing, CORS allow-list via `CORS_ORIGINS`, per-route rate limiting (SlowAPI), Pydantic input validation on every request body, file-type/size validation on uploads, all secrets via environment variables.
