import { ConstellationFigures } from "./constl_figures";
import { SkyProjection } from "./projection";
import { StarNames } from "./star_names";
import { Constellation, ConstellationCode } from "./types";

export class SkyProjectionPacker {
  private readonly coordinatePrecision = 10_000_000;
  private readonly namedStarMagnitudeMin = 2;
  private constlFigures: ConstellationFigures;
  private starNames: StarNames;

  constructor(constlFigures: ConstellationFigures, starNames: StarNames) {
    this.constlFigures = constlFigures;
    this.starNames = starNames;
  }

  /*
    function mint(
    ....
    uint32 latitude,
    uint32 longitude,
    uint32 datetime,
    uint96 constlBitMap,
    uint32[] calldata constlStarsBitMapArray,
    uint24[] calldata starsCoords)
  */
  pack(projection: SkyProjection): [bigint, bigint, string, bigint, number[], number[]] {
    return [
      this._tokenId(
        this._latitude(projection.latitude),
        this._longitude(projection.longitude),
        this._date(new Date(projection.date_iso8601)),
      ),
      this._visibleConstls(projection.constellations.map((constellation) => constellation.code)),
      this._visibleConstlStarsHex(projection.constellations),
      ...this._starsCoords(projection.constellations),
    ];
  }

  private _latitude(latitude: number): number {
    const latInt = Math.floor((latitude + 90) * this.coordinatePrecision);
    if (latInt < 0 || latInt > 90 * 2 * this.coordinatePrecision) {
      throw new Error("Latitude is out of range");
    }
    return latInt;
  }

  private _longitude(longitude: number): number {
    const longInt = Math.floor((longitude + 180) * this.coordinatePrecision);
    if (longInt < 0 || longInt > 90 * 4 * this.coordinatePrecision) {
      throw new Error("Longitude is out of range");
    }
    return longInt;
  }

  private _tokenId(latitude: number, longitude: number, datetime: bigint): bigint {
    // Ensure that the input values fit within the expected range
    if (latitude >= 2n ** 32n || longitude >= 2n ** 32n || datetime >= 2n ** 32n) {
      throw new Error("Input values must be within 32-bit range.");
    }

    // Combine the values into a single bigint
    const packed = datetime | (BigInt(longitude) << 32n) | (BigInt(latitude) << 64n);
    return packed;
  }

  private _date(date: Date): bigint {
    // Year: 12 bits, 2^12=4096; 2000 BC -> 0 -> 2095 AC
    // Month: 4 bits, 2^4 = 16
    // Day: 5 bits, 2^5 = 32
    // Hour: 5 bits, 2^5 = 32
    // Minute: 6 bits, 2^6 = 64
    // total: 32 bits

    const year = BigInt(date.getUTCFullYear() + 2000); // Adjust year for BC range
    const month = BigInt(date.getUTCMonth() + 1); // getMonth() returns 0-11
    const day = BigInt(date.getUTCDate());
    const hour = BigInt(date.getUTCHours());
    const minute = BigInt(date.getUTCMinutes());

    // Shift and combine the date components into a single integer
    const dateInt: bigint = (year << 20n) | (month << 16n) | (day << 11n) | (hour << 6n) | minute;
    return dateInt;
  }

  private _visibleConstls(visibleConstellations: ConstellationCode[]): bigint {
    let bitmask: bigint = BigInt(0);
    const visibleConstellationSet: Set<ConstellationCode> = new Set(visibleConstellations);

    this.constlFigures.constellationCodes.forEach((code, index) => {
      if (visibleConstellationSet.has(code)) {
        bitmask |= 1n << BigInt(index);
      }
    });

    return bitmask;
  }

  private _visibleConstlStarsHex(constellations: Constellation[]): string {
    let concatenatedBitmask = 0n;
    let offset = 0;

    constellations.forEach((constl) => {
      const sortedStarIds = this.constlFigures.sortedStarIds[constl.code];
      const visibleStarsSet = new Set(constl.stars.map((star) => star.id));

      sortedStarIds.forEach((starId) => {
        if (visibleStarsSet.has(starId)) {
          concatenatedBitmask |= 1n << BigInt(offset);
        }
        offset++;
      });
    });

    // hex string should be enough to represent whole bitmap
    let hexStr = concatenatedBitmask.toString(16).padStart(Math.ceil(offset / 4), "0");
    // also it must be correct bytes values, number of hex digits must be even
    if (hexStr.length % 2 != 0) {
      hexStr = "0" + hexStr;
    }

    // revert bytes representation for solidity (lower bytes should be at the beginning of bytes string)
    const reversed =
      "0x" +
        hexStr
          .match(/.{1,2}/g)
          ?.reverse()
          .join("") || "";

    return reversed;
  }

  // return array of packed stars coordinates
  private _starsCoords(constellations: Constellation[]): [bigint, number[], number[]] {
    const encodedCoordsArray: number[] = [];

    // Map<NamedStarId, indexInCoordsArray>
    let foundNamedStars: Map<number, number> = new Map();
    let namedStarsBitMap = 0n;
    let namedStarsInCoordsArray: number[] = [];

    // Process each constellation and its stars
    this.constlFigures.constellationCodes.forEach((code) => {
      const stars = constellations.find((c) => c.code === code)?.stars;
      if (!stars) return;

      // For each star, store its coordinates and update named star data
      this.constlFigures.sortedStarIds[code].forEach((id) => {
        const star = stars.find((s) => s.id === id);
        if (!star) return;

        // Store star coordinates
        encodedCoordsArray.push(this._coordsPair(star.x, star.y));

        // Put named star catalog id and id in coords array to map
        if (this.starNames.stars.has(id) && star.m <= this.namedStarMagnitudeMin) {
          foundNamedStars.set(id, encodedCoordsArray.length - 1);
        }
      });
    });

    // Generate bitmap and array for named stars
    let bitNumber = 0n;
    this.starNames.stars.forEach((_, namedStarId) => {
      if (foundNamedStars.has(namedStarId)) {
        namedStarsBitMap |= 1n << bitNumber;
        namedStarsInCoordsArray.push(foundNamedStars.get(namedStarId)!);
      }
      bitNumber++;
    });

    return [namedStarsBitMap, namedStarsInCoordsArray, encodedCoordsArray];
  }

  private _coordsPair(x: number, y: number): number {
    x = x & 0xfff; // Ensure x is within 12 bits
    y = y & 0xfff; // Ensure y is within 12 bits
    return (x << 12) | y; // Combine into a single 24-bit integer
  }
}

/*class SkyObject {
  id: number;
  x: number;
  y: number;

  MAX_16_BIT_SIGNED = 32767;
  MIN_16_BIT_SIGNED = -32768;
  RANGE_16_BIT = 65536;

  constructor(id: number, x: number, y: number) {
    this.id = id;
    this.x = this.limitTo16Bit(x);
    this.y = this.limitTo16Bit(y);
  }

  limitTo16Bit(value: number): number {
    // Enforce the 16-bit signed integer limits
    if (value > this.MAX_16_BIT_SIGNED) {
      value = this.MAX_16_BIT_SIGNED;
    } else if (value < this.MIN_16_BIT_SIGNED) {
      value = this.MIN_16_BIT_SIGNED;
    }
    return value;
  }

  encode(): string {
    const x = this.x < 0 ? this.x + this.RANGE_16_BIT : this.x;
    const y = this.y < 0 ? this.y + this.RANGE_16_BIT : this.y;
    return this.id.toString(16).padStart(6, "0") + x.toString(16).padStart(4, "0") + y.toString(16).padStart(4, "0");
  }
}

class SkyMap {
  latitude: number;
  longitude: number;
  place: string;
  dateUtc: Date; // in UTC, time included
  objects: SkyObject[];

  constructor(latitude: number, longitude: number, place: string, dateUtc: Date, objects: SkyObject[]) {
    // TODO: validate everything
    this.latitude = latitude;
    this.longitude = longitude;
    this.place = place;
    this.dateUtc = dateUtc;
    this.objects = objects;
  }

  formatDate(): string {
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
    // The toISOString() method of Date instances returns a string representing this date in the
    // date time string format, a simplified format based on ISO 8601, which is always 24 or 27 characters long
    // (YYYY-MM-DDTHH:mm:ss.sssZ or ±YYYYYY-MM-DDTHH:mm:ss.sssZ, respectively).
    // The timezone is always UTC, as denoted by the suffix Z.
    const isoString = this.dateUtc.toISOString().replace("T", " ");
    // Find the position of the second colon
    const secondColonIndex = isoString.lastIndexOf(":");
    return isoString.slice(0, secondColonIndex);
  }

  encodeDateTime(): string {
    // Year: 12 bits, 2^12=4096; 2000 BC -> 0 -> 2095 AC
    // Month: 4 bits, 2^4 = 16
    // Day: 5 bits, 2^5 = 32
    // Hour: 5 bits, 2^5 = 32
    // Minute: 6 bits, 2^6 = 64
    // total: 32 bits

    const year = this.dateUtc.getUTCFullYear() + 2000; // Adjust year for BC range
    const month = this.dateUtc.getUTCMonth() + 1; // getMonth() returns 0-11
    const day = this.dateUtc.getUTCDate();
    const hour = this.dateUtc.getUTCHours();
    const minute = this.dateUtc.getUTCMinutes();

    // Convert to binary strings with specified bit lengths
    const yearBin = year.toString(2).padStart(12, "0");
    const monthBin = month.toString(2).padStart(4, "0");
    const dayBin = day.toString(2).padStart(5, "0");
    const hourBin = hour.toString(2).padStart(5, "0");
    const minuteBin = minute.toString(2).padStart(6, "0");

    const binaryString = yearBin + monthBin + dayBin + hourBin + minuteBin;
    const hexString = parseInt(binaryString, 2).toString(16).padStart(8, "0"); //4 bytes = 8 hex chars
    return hexString;
  }

  encodeGeoCoordinates(): string {
    const precision = 10000000; // 7 decimal places
    const maxCoordinateValue = 90 * precision;
    const latInt = Math.floor((this.latitude + 90) * precision);
    const longInt = Math.floor((this.longitude + 180) * precision);

    if (latInt < 0 || latInt > maxCoordinateValue * 2 || longInt < 0 || longInt > maxCoordinateValue * 4) {
      throw new Error("Coordinates are out of range");
    }

    const res = latInt.toString(16).padStart(8, "0") + longInt.toString(16).padStart(8, "0");
    return res;
  }

  encodePlace(): string {
    const buf = Buffer.from(this.place, "utf-8");
    return buf.byteLength.toString(16).padStart(2, "0") + buf.toString("hex");
  }

  encode(): string {
    const encodedGeo = this.encodeGeoCoordinates();
    const encodedPlace = this.encodePlace();
    const encodedDateTime = this.encodeDateTime();
    const encodedObjects = this.objects.map((obj) => obj.encode()).join("");
    const response = "0x" + encodedGeo + encodedPlace + encodedDateTime + encodedObjects;
    console.log(response);
    return response;
  }
}*/
