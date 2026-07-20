from app.utils.geo import make_point

SEED_SHELTERS = [
    {"name": "Civil Lines Community Shelter", "lat": 26.9139, "lng": 75.7885, "capacity": 240, "occupancy": 90, "status": "open"},
    {"name": "Malviya Nagar Relief Center", "lat": 26.8535, "lng": 75.8047, "capacity": 180, "occupancy": 70, "status": "open"},
    {"name": "Vaishali Nagar Govt. School Shelter", "lat": 26.9127, "lng": 75.7364, "capacity": 300, "occupancy": 275, "status": "nearing_capacity"},
    {"name": "Jagatpura Sports Complex Shelter", "lat": 26.8206, "lng": 75.8425, "capacity": 400, "occupancy": 120, "status": "open"},
]


def shelter_document(name: str, lat: float, lng: float, capacity: int, occupancy: int, status: str) -> dict:
    return {
        "name": name,
        "location": make_point(lng, lat),
        "capacity": capacity,
        "occupancy": occupancy,
        "status": status,
    }
