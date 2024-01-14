import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import { useAccount } from "wagmi";
import { parseEther } from "viem";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { ConstellationFigures, SkyProjection, SkyProjectionPacker, StarNames } from "@SkyNft/sdk";

const API_URL = "http://127.0.0.1:8000/api/skymap/";

export const SkyNftCreator = () => {
  const areEqual = (prevProps, nextProps) => true;
  const SkyNftLocationSelectorDynamic = React.memo(
    dynamic(() => import("./SkyNftLocationSelector"), { ssr: false }),
    areEqual,
  );

  const [coordinates, setCoordinates] = useState(null);
  const [dateTime, setDateTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  ////////////////////
  ////CHECK WETHER CONNECTED
  const account = useAccount();

  const starNames = new StarNames();
  const constlFigures = new ConstellationFigures();
  const packer = new SkyProjectionPacker(constlFigures, starNames);
  ////////////////const skyProjection = new SkyProjection(apiResponse, constlFigures);

  const { writeAsync, isLoading1 } = useScaffoldContractWrite({
    contractName: "SkyNft",
    functionName: "mint",
    args: [],
    value: parseEther("0"),
    onBlockConfirmation: txnReceipt => {
      console.log("📦 Transaction blockHash", txnReceipt.blockHash);
    },
  });

  const handleLocationSelect = location => {
    setCoordinates(location);
  };

  const handleMint = async () => {
    if (!coordinates || !dateTime) {
      setError("Please select both coordinates and date/time.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await axios.get(
        `${API_URL}?latitude=${coordinates.lat}&longitude=${coordinates.lng}&date_iso8601=${encodeURIComponent(
          dateTime,
        )}`,
      );
      if (!response.data) {
        // && response.data.latitude && response.data.longitude && response.data.date_iso8601
        //&& response.data.constellations && response.data.constellations.length>0
        /////////////////////
        //account.isConnected
        throw new Error("Invalid response from server");
      }
      const skyProjection = new SkyProjection(response.data, constlFigures);
      writeAsync({
        args: [account.address, ...packer.pack(skyProjection)],
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
      <div className="flex">
        <div className="w-1/2 p-2 h-96">
          <SkyNftLocationSelectorDynamic onLocationSelect={handleLocationSelect} />
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
