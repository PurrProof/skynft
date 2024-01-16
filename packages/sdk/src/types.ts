export type StarID = number;

export type ConstellationCode = string;

export interface Star {
  id: StarID;
  x: number;
  y: number;
  m: number;
}

export interface Constellation {
  code: ConstellationCode;
  stars: Star[];
}

export interface ISkyProjection {
  latitude: number;
  longitude: number;
  date_iso8601: Date;
  constellations: Constellation[];
  formatDate(): string;
}

export interface ISkyProjectionApiResponse {
  latitude: number;
  longitude: number;
  date_iso8601: string;
  constellations: Constellation[];
}
