import { expect } from "chai";
import { Contract } from "ethers";
import fs from "fs";
import { ethers } from "hardhat";
import opn from "opn";

import type { SkyNft } from "../types";
import { parseConstellations } from "./utils";

describe("SkyNft", function () {
  let skynft: SkyNft;

  this.timeout(180_000); // Timeout in milliseconds, e.g., 60000 for 60 seconds

  beforeEach(async function () {
    // Deploy the SkyNft contract
    const SkyNft = await ethers.getContractFactory("SkyNft");
    skynft = await SkyNft.deploy();
    await skynft.waitForDeployment(); // Wait for the deployment transaction
  });

  it("should add constellations correctly", async function () {
    const names = ["Orion", "Andromeda"];
    const starIdsBatch = [
      [10144, 10145, 10146], // Orion star IDs
      [20222, 20223, 20224], // Andromeda star IDs
    ];

    await skynft.addConstellationBatch(names, starIdsBatch);

    const [orionName, orionStarIds] = await skynft.getConstellation(0);
    const [andromedaName, andromedaStarIds] = await skynft.getConstellation(1);

    expect(orionName).to.equal("Orion");
    expect(orionStarIds.length).to.equal(3);
    expect(orionStarIds[0]).to.equal(10144);

    expect(andromedaName).to.equal("Andromeda");
    expect(andromedaStarIds.length).to.equal(3);
    expect(andromedaStarIds[0]).to.equal(20222);
  });

  it("should decode geo data correctly", async function () {
    const skyMap = new SkyMap(
      34.0194736, // lat
      -119.0355556, // lon
      "Лос-Анжелес", // place,
      new Date("2023-12-30 15:55Z"),
      [new SkyObject(12345, 1000, 2001), new SkyObject(23456, -3000, -4000)], // Sky Objects
    );
    const fromEvm = await skynft.decodeSkyMap(skyMap.encode());

    const latString = await skynft.coordString(fromEvm.latitude);
    const lonString = await skynft.coordString(fromEvm.longitude);

    expect(latString).to.equal(skyMap.latitude.toFixed(7).toString());
    expect(lonString).to.equal(skyMap.longitude.toFixed(7).toString());
    expect(await skynft.datetimeString(fromEvm.datetime)).to.equal(skyMap.formatDate());
    expect(fromEvm.place).to.equal(skyMap.place);
    expect(fromEvm.objects.length).to.equal(skyMap.objects.length);

    for (let i = 0; i < fromEvm.objects.length; i++) {
      expect(fromEvm.objects[i].id).to.equal(skyMap.objects[i].id);
      expect(fromEvm.objects[i].x).to.equal(skyMap.objects[i].x);
      expect(fromEvm.objects[i].y).to.equal(skyMap.objects[i].y);
    }
  });

  it("should work correctly with edge values", async function () {
    let skyMap = new SkyMap(
      -90, // lat
      -180, // lon
      "South Pole", // place
      new Date("-001999-12-21 23:55Z"),
      [new SkyObject(12345, -100_000, -200_000), new SkyObject(23456, 300_000, 400_000)],
    );
    let fromEvm = await skynft.decodeSkyMap(skyMap.encode());
    expect(await skynft.coordString(fromEvm.latitude)).to.equal(skyMap.latitude.toFixed(7).toString());
    expect(await skynft.coordString(fromEvm.longitude)).to.equal(skyMap.longitude.toFixed(7).toString());
    expect(await skynft.datetimeString(fromEvm.datetime)).to.equal(skyMap.formatDate());
    for (let i = 0; i < fromEvm.objects.length; i++) {
      expect(fromEvm.objects[i].id).to.equal(skyMap.objects[i].id);
      expect(fromEvm.objects[i].x).to.equal(skyMap.objects[i].x);
      expect(fromEvm.objects[i].y).to.equal(skyMap.objects[i].y);
    }
    skyMap = new SkyMap(
      90, // lat
      180, // lon
      "North Pole", // place
      new Date("2094-12-31 23:59Z"),
      [], // Sky Objects
    );
    fromEvm = await skynft.decodeSkyMap(skyMap.encode());
    expect(await skynft.coordString(fromEvm.latitude)).to.equal(skyMap.latitude.toFixed(7).toString());
    expect(await skynft.coordString(fromEvm.longitude)).to.equal(skyMap.longitude.toFixed(7).toString());
    expect(await skynft.datetimeString(fromEvm.datetime)).to.equal(skyMap.formatDate());

    // TODO: test coordinates overflowing limits, expect revert
  });

  it("Should render SVG for the given token ID", async function () {
    const [names, starIdsBatch] = parseConstellations("downloads/constellationship.fab");
    const BATCH_SIZE = 22;
    for (let i = 0; i < names.length; i += BATCH_SIZE) {
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const batchNames = names.slice(i, i + BATCH_SIZE);
      const batchStarIds = starIdsBatch.slice(i, i + BATCH_SIZE);

      await skynft.addConstellationBatch(batchNames, batchStarIds);

      console.log(`Batch ${batchNumber} sent. (${batchNames.length} constellations)`);
    }
    console.log(`All batches sent successfully. Total batches: ${Math.ceil(names.length / BATCH_SIZE)}`);

    console.log(await skynft.getConstellation(0));

    const tokenUriDataJson = await skynft.tokenURI();
    console.log(1);
    return;
    const svg = await getSvgFromTokenUri(tokenUriDataJson);
    console.log(svg);
    // expect(svg).to.include("<svg");
    fs.writeFileSync("build/token1.svg", svg, "utf-8");
    await opn("build/token1.svg", { wait: false });
  });
});

// this function is not utils because it is outadted
async function getSvgFromTokenUri(dataUri: string): Promise<string> {
  try {
    const data = dataUri.split(",")[1];
    if (!data) {
      throw new Error("Invalid Data URI format");
    }

    const metadata: string = Buffer.from(data, "base64").toString("utf8");
    const parsedMetadata: { image?: string } = JSON.parse(metadata);

    if (!parsedMetadata.image || !parsedMetadata.image.startsWith("data:image/svg+xml;base64,")) {
      throw new Error("Invalid or missing image data in metadata");
    }

    return Buffer.from(parsedMetadata.image.replace("data:image/svg+xml;base64,", ""), "base64").toString("utf8");
  } catch (error) {
    console.error("Error getting SVG from token URI:", error);
    throw error;
  }
}

class SkyObject {
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
}
