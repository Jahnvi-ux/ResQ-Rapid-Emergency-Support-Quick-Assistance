from pydantic import BaseModel


class CurrentWeather(BaseModel):
    location: str
    temperature_c: float
    feels_like_c: float
    condition: str
    humidity_pct: int
    wind_kmh: float
    rainfall_chance_pct: int
    updated_at: str


class ForecastDay(BaseModel):
    day: str
    condition: str
    icon: str
    high_c: float
    low_c: float


class WeatherAlert(BaseModel):
    title: str
    severity: str  # "warning" | "watch" | "advisory"
    description: str
