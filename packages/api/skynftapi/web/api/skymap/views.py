from fastapi import APIRouter, Depends

from skynftapi.services.projection import SkyProjection

from .schema import SkyMap, SkyMapInput

router = APIRouter()

# TODO move to settings, make changeable ?
CANVAS_WIDTH = 1024
CANVAS_HEIGHT = 1024

# @router.get("/", response_model=str)
@router.get("/", response_model=SkyMap)
async def get_encoded_skymap(input_data: SkyMapInput = Depends()) -> SkyMap:

    sky_map = SkyMap(
        latitude=input_data.latitude,
        longitude=input_data.longitude,
        date_iso8601=input_data.date_iso8601,
    )

    # Initialize SkyProjection and transform coordinates
    skyProj = SkyProjection(
        input_data.date_iso8601,
        input_data.latitude,
        input_data.longitude,
    )
    visible_stars_projection = skyProj.get_visible_stars_by_constellation()
    sky_map.constellations = skyProj.transform_to_canvas(
        visible_stars_projection,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
    )

    return sky_map

    # return sky_map.encode()

    # sky_map = SkyMap(
    #     latitude=34.0194736,
    #     longitude=-119.0355556,
    #     place="Лос-Анжелес",
    #     date_iso8601="2023-12-30T15:55+00:00",
    #     objects=[
    #         SkyObject(id=12345, x=1000, y=2001),
    #         SkyObject(id=23456, x=3000, y=4000),
    #     ],
    # )

    # Second SkyMap Object (commented out for now)
    # sky_map = SkyMap(
    #     latitude=-90,
    #     longitude=-180,
    #     place="South Pole",
    #     date_iso8601="-001999-12-21T23:55+00:00",
    #     objects=[]
    # )

    # Third SkyMap Object (commented out for now)
    # sky_map = SkyMap(
    #     latitude=90,
    #     longitude=180,
    #     place="North Pole",
    #     date_iso8601="2094-12-31T23:59+00:00",
    #     objects=[]
    # )
