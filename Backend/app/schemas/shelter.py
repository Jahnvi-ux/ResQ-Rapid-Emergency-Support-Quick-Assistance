from pydantic import BaseModel


class ShelterOut(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    distance_km: float
    capacity: int
    occupancy: int
    status: str  # "open" | "nearing_capacity" | "full" | "closed"
    navigation_url: str


class ShelterFilters(BaseModel):
    status: str | None = None
    min_capacity: int | None = None
