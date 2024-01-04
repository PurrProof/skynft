from typing import List

import metomi.isodatetime.parsers as parse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, Field, validator

# from skynftapi.services.geocoding import get_place_name
from skynftapi.services.projection import Constellation


class SkyMapInput(BaseModel):
    # TODO: better validate input parameters
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    date_iso8601: str

    @validator("date_iso8601")
    def validate_date(cls, v: str) -> str:
        try:
            datetime = parse.TimePointParser().parse(v)
            if not (-2000 <= datetime.year < 2096):
                # TODO this returns {"detail": "string"}
                # ValueError is not json serializeable
                # https://github.com/tiangolo/fastapi/issues/3761 issue
                # https://github.com/tiangolo/fastapi/issues/1474 issue
                # https://github.com/tiangolo/fastapi/discussions/9071 discussion
                raise RequestValidationError("Year must be between 2000 BC and 2096 AD")
        except parse.ISO8601SyntaxError as e:
            raise RequestValidationError("Invalid ISO 8601 date format")
        return v


class SkyMap(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    # place: str = ""
    date_iso8601: str
    constellations: List[Constellation] = []

    # def model_post_init(self, __context: Any) -> None:
    # self.place = get_place_name(self.latitude, self.longitude)
