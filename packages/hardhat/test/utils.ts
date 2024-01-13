import { Buffer } from "buffer";
import fs from "fs";

export async function decodeSvgDataUri(dataUri: string): Promise<string> {
  try {
    if (!dataUri.startsWith("data:image/svg+xml;base64,")) {
      throw new Error("Invalid or missing image data in metadata");
    }
    return Buffer.from(dataUri.replace("data:image/svg+xml;base64,", ""), "base64").toString("utf8");
  } catch (error) {
    console.error("Error getting SVG from data URI:", error);
    throw error;
  }
}

export function parseConstellations(filename: string): [string[], number[][]] {
  const data = fs.readFileSync(filename, { encoding: "utf8", flag: "r" });
  const lines = data.split("\n");

  let names: string[] = [];
  let starIdsBatch: number[][] = [];

  lines.forEach((line) => {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 3) return;

    const name = parts[0];
    const starIds = parts.slice(2).map(Number);

    names.push(name);
    starIdsBatch.push(starIds);
  });

  return [names, starIdsBatch];
}
