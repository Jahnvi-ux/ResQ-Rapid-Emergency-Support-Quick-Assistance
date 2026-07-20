"""Geospatial helpers built around MongoDB's GeoJSON conventions."""
from math import atan2, cos, radians, sin, sqrt


def make_point(lng: float, lat: float) -> dict:
    """MongoDB GeoJSON Point. NOTE: GeoJSON order is [lng, lat]."""
    return {"type": "Point", "coordinates": [lng, lat]}


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance between two points, in kilometers."""
    r = 6371.0
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    return r * 2 * atan2(sqrt(a), sqrt(1 - a))


def maps_navigation_url(lat: float, lng: float) -> str:
    """Google Maps direction URL — works today, replace with Maps SDK later if needed."""
    return f"https://www.google.com/maps/dir/?api=1&destination={lat},{lng}"
