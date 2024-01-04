import { Constellation, ConstellationFigures, ISkyProjection } from "./index";

export class SkyProjection implements ISkyProjection {
  private constlFigures: ConstellationFigures;
  latitude: number;
  longitude: number;
  date_iso8601: string;
  constellations: Constellation[];

  constructor(data: ISkyProjection, constlFigures: ConstellationFigures) {
    this.constlFigures = constlFigures;
    this.latitude = data.latitude;
    this.longitude = data.longitude;
    this.date_iso8601 = data.date_iso8601;
    this.constellations = data.constellations;

    this._cleanOrphanes();
  }

  private _cleanOrphanes() {
    // Filter out constellations that have no stars left after cleaning orphaned stars
    this.constellations = this.constellations.filter((constellation) => {
      // Filter stars that are part of at least one pair in the constellation
      constellation.stars = constellation.stars.filter((star) =>
        this.constlFigures.starIdPairs[constellation.code].some((pair) => pair.includes(star.id)),
      );

      // Keep the constellation if it still has stars
      return constellation.stars.length > 0;
    });
  }
}
