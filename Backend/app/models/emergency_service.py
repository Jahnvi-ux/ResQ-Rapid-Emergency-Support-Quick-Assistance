from app.utils.geo import make_point

SEED_SERVICES = [
    {"name": "SMS Government Hospital", "type": "hospital", "lat": 26.9096, "lng": 75.8090, "phone": "+91-141-2560291"},
    {"name": "Ashok Nagar Police Station", "type": "police", "lat": 26.9155, "lng": 75.8080, "phone": "112"},
    {"name": "Central Fire Station", "type": "fire_station", "lat": 26.9180, "lng": 75.8010, "phone": "101"},
    {"name": "Malviya Nagar Relief Camp", "type": "relief_camp", "lat": 26.8535, "lng": 75.8047, "phone": "+91-141-2711000"},
]


def emergency_service_document(name: str, type: str, lat: float, lng: float, phone: str) -> dict:
    return {
        "name": name,
        "type": type,  # "hospital" | "police" | "fire_station" | "relief_camp"
        "location": make_point(lng, lat),
        "phone": phone,
    }
