"""
WeatherService abstraction.

`WeatherProvider` defines the contract. `MockWeatherProvider` is the
active implementation until a real key is configured. Swapping in
OpenWeatherMap / WeatherAPI / Tomorrow.io / Visual Crossing later is a
matter of adding a new provider class and switching `get_weather_provider()`
— nothing in routers or the rest of the service layer needs to change.
"""
import random
from abc import ABC, abstractmethod
from datetime import datetime, timedelta, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings


class WeatherProvider(ABC):
    @abstractmethod
    async def get_current(self, lat: float, lng: float) -> dict: ...

    @abstractmethod
    async def get_forecast(self, lat: float, lng: float, days: int = 7) -> list[dict]: ...

    @abstractmethod
    async def get_alerts(self, lat: float, lng: float) -> list[dict]: ...


class MockWeatherProvider(WeatherProvider):
    """Deterministic-ish mock data so the frontend has something
    realistic to render while no provider key is configured."""

    CONDITIONS = ["Clear", "Partly Cloudy", "Cloudy", "Light Rain", "Heavy Rain", "Windy"]
    ICONS = {"Clear": "sun", "Partly Cloudy": "cloud", "Cloudy": "cloud", "Light Rain": "droplet", "Heavy Rain": "droplet", "Windy": "wind"}

    async def get_current(self, lat: float, lng: float) -> dict:
        temp = round(24 + random.uniform(-3, 9), 1)
        return {
            "location": "Jaipur, Rajasthan",
            "temperature_c": temp,
            "feels_like_c": round(temp + random.uniform(1, 3), 1),
            "condition": "Partly Cloudy",
            "humidity_pct": random.randint(35, 60),
            "wind_kmh": round(random.uniform(6, 18), 1),
            "rainfall_chance_pct": random.randint(10, 70),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

    async def get_forecast(self, lat: float, lng: float, days: int = 7) -> list[dict]:
        names = ["Today", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"]
        forecast = []
        for i in range(days):
            condition = random.choice(self.CONDITIONS)
            forecast.append(
                {
                    "day": names[i % len(names)],
                    "condition": condition,
                    "icon": self.ICONS[condition],
                    "high_c": round(27 + random.uniform(-4, 8), 1),
                    "low_c": round(18 + random.uniform(-3, 5), 1),
                }
            )
        return forecast

    async def get_alerts(self, lat: float, lng: float) -> list[dict]:
        return [
            {
                "title": "Heavy Rain Warning",
                "severity": "warning",
                "description": "Sustained heavy rainfall expected through tonight. Avoid low-lying and flood-prone areas.",
            }
        ]


def get_weather_provider() -> WeatherProvider:
    if settings.OPENWEATHER_API_KEY:
        # TODO: return OpenWeatherMapProvider() once implemented.
        pass
    if settings.WEATHERAPI_KEY:
        # TODO: return WeatherAPIProvider() once implemented.
        pass
    return MockWeatherProvider()


CACHE_TTL_MINUTES = 15


async def get_current_weather_cached(db: AsyncIOMotorDatabase, lat: float, lng: float) -> dict:
    cache_key = f"current:{round(lat, 2)}:{round(lng, 2)}"
    cached = await db.weather_cache.find_one({"_id": cache_key})
    if cached:
        return cached["payload"]

    payload = await get_weather_provider().get_current(lat, lng)
    await db.weather_cache.update_one(
        {"_id": cache_key},
        {"$set": {"payload": payload, "expires_at": datetime.now(timezone.utc) + timedelta(minutes=CACHE_TTL_MINUTES)}},
        upsert=True,
    )
    return payload
