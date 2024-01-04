from geopy.exc import GeocoderInsufficientPrivileges, GeocoderTimedOut, GeopyError
from geopy.geocoders import Nominatim


class GeocodingError(Exception):
    pass


def get_place_name(latitude: float, longitude: float) -> str:
    geolocator = Nominatim(user_agent="SkyMapNft")

    try:
        location = geolocator.reverse((latitude, longitude), exactly_one=True)
        if location is not None:
            return location.address
    except GeocoderTimedOut:
        raise GeocodingError("Geocoding service timed out")
    except GeocoderInsufficientPrivileges:
        raise GeocodingError("Insufficient privileges for geocoding service")
    except GeopyError as e:
        raise GeocodingError(f"Geocoding service error: {str(e)}")
    return "Place not found"
