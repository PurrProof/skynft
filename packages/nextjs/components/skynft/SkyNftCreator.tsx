import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useAccount } from "wagmi";
import { parseEther, Address } from "viem";
import { useScaffoldContractWrite, useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import { ConstellationFigures, SkyProjection, SkyProjectionPacker, StarNames } from "@SkyNft/sdk";
import scaffoldConfig from "~~/scaffold.config";
import { SkyNftLocationSelectorDyn } from "./SkyNftLocationSelectorDyn";

const starNames = new StarNames();
const constlFigures = new ConstellationFigures();
const packer = new SkyProjectionPacker(constlFigures, starNames);

interface Coordinates {
  lat: number;
  lng: number;
}

export const SkyNftCreator = () => {
  ////////////////////
  ////CHECK WETHER CONNECTED
  const account = useAccount();
  ////////////////const skyProjection = new SkyProjection(apiResponse, constlFigures);

  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [dateTime, setDateTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const tokenId = useMemo(() => {
    if (coordinates && dateTime) {
      return packer.tokenId(coordinates.lat, coordinates.lng, new Date(dateTime));
    }
    return null;
  }, [coordinates, dateTime]);

  useEffect(() => {
    // Reset error when coordinates or dateTime change
    setError("");
  }, [coordinates, dateTime]);

  const { data: ownerOfData, isError: isOwnerOfError } = useScaffoldContractRead({
    contractName: "SkyNft",
    functionName: "ownerOf",
    args: [tokenId ?? undefined],
    watch: tokenId != null, // Only watch and update when tokenId is not null
  });

  const { writeAsync } = useScaffoldContractWrite({
    contractName: "SkyNft",
    functionName: "mint",
    args: [account.address as Address, 0n, 0n, "" as Address, 0n, [], []],
    value: parseEther("0"),
    onBlockConfirmation: txnReceipt => {
      console.log("📦 Transaction blockHash", txnReceipt.blockHash);
    },
  });

  const handleLocationSelect = (location: Coordinates) => {
    setCoordinates(location);
  };

  const handleMint = async () => {
    if (!coordinates || !dateTime) {
      setError("Please select both coordinates and date/time.");
      return;
    } else if (ownerOfData && !isOwnerOfError) {
      setError("Token already exists.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await axios.get(
        `${scaffoldConfig.skyNftApiUrl}?latitude=${coordinates.lat}&longitude=${
          coordinates.lng
        }&date_iso8601=${encodeURIComponent(dateTime)}`,
      );
      if (!response.data) {
        // && response.data.latitude && response.data.longitude && response.data.date_iso8601
        //&& response.data.constellations && response.data.constellations.length>0
        /////////////////////
        //account.isConnected
        throw new Error("Invalid response from server");
      }
      const skyProjection = new SkyProjection(response.data, constlFigures);
      const packedData = packer.pack(skyProjection);

      writeAsync({
        args: [
          account.address as Address,
          packedData[0],
          packedData[1],
          packedData[2] as Address,
          packedData[3],
          packedData[4],
          packedData[5],
        ],
      });

      //here we have correct response
      //so I need state to be updated and then wryteAsync func recreated based on new args
    } catch (e) {
      if (e && typeof e == "object" && e.toString) {
        setError(e.toString());
      } else {
        setError("Unknown error");
      }
      console.error(e);
    }
    setIsLoading(false);
  };

  return (
    <>
      <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">Mint SkyNft</h2>
      <div className="flex mb-10">
        <div className="w-1/2 p-2 h-96">
          <SkyNftLocationSelectorDyn onLocationSelect={handleLocationSelect} />
        </div>
        <div className="w-1/2 p-2 flex flex-col">
          <div className="form-control w-full max-w-xs">
            <input
              type="datetime-local"
              className="input input-bordered w-full"
              min="-002000-01-01T00:00"
              max="2094-12-31T23:59"
              onChange={e => setDateTime(e.target.value)}
            />
          </div>
          <p>
            Coordinates:{" "}
            {coordinates ? (
              <span>
                Lat: {coordinates.lat}, Lon: {coordinates.lng}
              </span>
            ) : (
              <span>not selected</span>
            )}
          </p>
          {error && <p className="text-red-500">{error}</p>}
          {isLoading && <p>Loading...</p>}
          <button className="btn btn-primary mt-2" onClick={handleMint}>
            Mint SkyMap
          </button>
        </div>
      </div>
    </>
  );
};
