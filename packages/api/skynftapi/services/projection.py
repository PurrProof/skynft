from dataclasses import dataclass
from typing import List

import metomi.isodatetime.parsers as parse
import numpy as np
from skyfield.api import Star, load, load_file, wgs84
from skyfield.data import hipparcos, stellarium
from skyfield.projections import build_stereographic_projection


@dataclass
class ConstellationStar:
    id: int
    x: int
    y: int
    m: float  # magnitude


@dataclass
class Constellation:
    code: str
    stars: List[ConstellationStar]


# TODO dowload errors handling
# TODO better input parameters validation


class SkyProjection:
    X_MIN = -1.0
    X_MAX = 1.0
    Y_MIN = -1.0
    Y_MAX = 1.0

    def __init__(self, date_iso8601: str, latitude: float, longitude: float) -> None:
        self.date_iso8601 = date_iso8601
        self.latitude = latitude
        self.longitude = longitude
        self.load_data()

    def load_data(self) -> None:
        # Parse date and time
        datetime = parse.TimePointParser().parse(self.date_iso8601)
        year, month, day, hour, minute = (
            datetime.year,
            datetime.month_of_year,
            datetime.day_of_month,
            datetime.hour_of_day,
            datetime.minute_of_hour,
        )
        ts = load.timescale()
        time = ts.utc(year, month, day, hour, minute)

        # Load ephemeris dataload = load.create_loader('./downloads')
        self.ephemeris = load_file("downloads/de406.bsp")
        self.earth = self.ephemeris["earth"]

        # Load star data
        with load.open(hipparcos.URL, filename="downloads/hip_main.data") as f:
            self.stardata = hipparcos.load_dataframe(f)

        # Load constellation data
        constUrl = "https://raw.githubusercontent.com/Stellarium/stellarium/master/skycultures/modern/constellationship.fab"
        with load.open(constUrl, filename="downloads/constellationship.fab") as f:
            self.consdata = stellarium.parse_constellations(f)

        # Calculate star positions
        self.position = (
            wgs84.latlon(self.latitude, self.longitude, elevation_m=0.0)
            .at(time)
            .from_altaz(alt_degrees=90, az_degrees=0)
        )
        self.projection = build_stereographic_projection(self.position)
        star_positions = self.earth.at(time).observe(Star.from_dataframe(self.stardata))
        self.stardata["x"], self.stardata["y"] = self.projection(star_positions)

    def get_visible_stars_by_constellation(self) -> List[Constellation]:
        """
        Filters and groups star data by constellations.

        Creates a list of Constellation objects, each containing visible stars within that constellation.
        Stars are considered visible if their coordinates fall within the defined X_MIN, X_MAX, Y_MIN, and Y_MAX range.
        Constellations with no visible stars are excluded from the output.

        Returns:
            List[Constellation]: A list of Constellation objects with visible stars.
        """
        # Create dictionary of constellations with their star IDs
        constellation_stars = {
            name: {star for edge in edges for star in edge}
            for name, edges in self.consdata
        }

        visible_constellations = []
        for name, star_ids in constellation_stars.items():
            visible_stars = [
                ConstellationStar(
                    id=hip_id,
                    x=self.stardata.loc[hip_id]["x"],
                    y=self.stardata.loc[hip_id]["y"],
                    m=self.stardata.loc[hip_id]["magnitude"],
                )
                for hip_id in star_ids
                if self.X_MIN <= self.stardata.loc[hip_id]["x"] <= self.X_MAX
                and self.Y_MIN <= self.stardata.loc[hip_id]["y"] <= self.Y_MAX
            ]

            if visible_stars:
                visible_constellations.append(
                    Constellation(code=name, stars=visible_stars),
                )

        return visible_constellations

    def transform_to_canvas(
        self,
        constellations: List[Constellation],
        canvas_width: int,
        canvas_height: int,
    ) -> List[Constellation]:
        """
        Transforms the celestial coordinates of stars in each constellation to canvas coordinates.

        Args:
            constellations (List[Constellation]): A list of Constellation objects.
            canvas_width (int): The width of the canvas.
            canvas_height (int): The height of the canvas.

        Returns:
            List[Constellation]: A list of Constellation objects with transformed star coordinates.
        """

        for constellation in constellations:
            for star in constellation.stars:
                star.x = int(
                    np.rint(
                        ((star.x - self.X_MIN) / (self.X_MAX - self.X_MIN))
                        * canvas_width,
                    ),
                )
                star.y = int(
                    np.rint(
                        ((self.Y_MAX - star.y) / (self.Y_MAX - self.Y_MIN))
                        * canvas_height,
                    ),
                )

        return constellations


"""
    skyProj = SkyProjection("2023-12-30T15:55+00:00", 34.0194736, -119.0355556)
"""
