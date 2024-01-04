import fs from "fs";

import { ConstellationCode, Star, StarID } from "./types";

export class ConstellationFigures {
  constellationCodes: ConstellationCode[] = [];
  sortedStarIds: Record<ConstellationCode, StarID[]> = {};
  starIdPairs: Record<ConstellationCode, StarID[][]> = {};
  starIndexPairs: Record<ConstellationCode, number[][]> = {};

  constructor(input: string | { filePath: string } = { filePath: __dirname + "/constellationship.fab" }) {
    if (typeof input === "string") {
      this.initFromString(input);
    } else if (input.filePath && typeof input.filePath === "string") {
      this.initFromFile(input.filePath);
    } else {
      throw new Error("Invalid input: expected a string or an object with a filePath property.");
    }
  }

  initFromFile(filePath: string): void {
    const fileContents = fs.readFileSync(filePath, "utf-8");
    this.initFromString(fileContents);
  }

  initFromString(str: string): void {
    const lines = str.trim().split("\n");

    for (const line of lines) {
      const parts = line.split(" ");
      const constellationCode = parts[0];
      // pairs[0] is number of pairs
      const starPairs = parts.slice(3).map(Number);

      this.constellationCodes.push(constellationCode);

      // Create a unique set of star IDs for each constellation
      const starIds = new Set<StarID>();
      for (let i = 0; i < starPairs.length; i += 2) {
        starIds.add(starPairs[i]);
        starIds.add(starPairs[i + 1]);
      }

      this.sortedStarIds[constellationCode] = Array.from(starIds).sort((a, b) => a - b);

      // Create the index pairs for each constellation
      this.starIndexPairs[constellationCode] = [];
      this.starIdPairs[constellationCode] = [];
      for (let i = 0; i < starPairs.length; i += 2) {
        const startIndex = this.sortedStarIds[constellationCode].indexOf(starPairs[i]);
        const endIndex = this.sortedStarIds[constellationCode].indexOf(starPairs[i + 1]);
        this.starIndexPairs[constellationCode].push([startIndex, endIndex]);
        this.starIdPairs[constellationCode].push([starPairs[i], starPairs[i + 1]]);
      }
    }
  }

  findPair(constellationCode: ConstellationCode, starId: StarID): StarID | null {
    const pairs = this.starIdPairs[constellationCode];
    if (!pairs) return null;

    for (const pair of pairs) {
      if (pair.includes(starId)) {
        return pair[0] === starId ? pair[1] : pair[0];
      }
    }
    return null;
  }
}
