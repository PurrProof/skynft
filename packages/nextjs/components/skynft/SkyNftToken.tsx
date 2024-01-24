import { useState, useEffect } from "react";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import ShadowSvg from "./ShadowSvg";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { Address } from "viem";
import { UseScaffoldReadConfig } from "~~/utils/scaffold-eth/contract";

interface SkyNftTokenProps {
  ownerAddress: string;
  index: number;
}

export const SkyNftToken = ({ ownerAddress, index }: SkyNftTokenProps) => {
  const [tokenId, setTokenId] = useState<bigint | undefined>(undefined);
  const [tokenData, setTokenData] = useState<any>(null);
  const [locationName, setLocationName] = useState("");

  const params1: UseScaffoldReadConfig<"SkyNft", "tokenByIndex"> = {
    contractName: "SkyNft",
    functionName: "tokenByIndex",
    args: [BigInt(index)],
    watch: true,
  };

  const params2: UseScaffoldReadConfig<"SkyNft", "tokenOfOwnerByIndex"> = {
    contractName: "SkyNft",
    functionName: "tokenOfOwnerByIndex",
    args: [ownerAddress as Address, BigInt(index)],
    watch: true,
  };

  const readConfig = ownerAddress === "" ? params1 : params2;

  const { data, isLoading } = useScaffoldContractRead(readConfig);

  const { data: tokenUri } = useScaffoldContractRead({
    contractName: "SkyNft",
    functionName: "tokenURI",
    args: [tokenId],
    watch: tokenId !== null,
  });

  useEffect(() => {
    if (data) {
      setTokenId(BigInt(data.toString()));
    }
  }, [data]);

  useEffect(() => {
    if (tokenUri) {
      try {
        const jsonBase64 = tokenUri.split(",")[1];
        const json = Buffer.from(jsonBase64, "utf-8").toString();
        const parsedData = JSON.parse(decodeURIComponent(json));
        setTokenData(parsedData);
      } catch (error) {
        console.error("Error parsing token data:", error);
      }
    }
  }, [tokenUri]);

  useEffect(() => {
    if (tokenData?.name) {
      const coordMatch = tokenData.name.match(/@([\d.-]+),\s*([\d.-]+)/);
      if (coordMatch) {
        const latitude = coordMatch[1];
        const longitude = coordMatch[2];
        fetchLocationName(latitude, longitude);
      }
    }
  }, [tokenData]);

  const fetchLocationName = async (latitude: number, longitude: number) => {
    try {
      // Nominatim API endpoint for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=9`,
      );
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setLocationName(data.display_name);
    } catch (error) {
      console.error("Error fetching location name:", error);
      setLocationName(""); // Reset location name in case of error
    }
  };

  if (isLoading) {
    return <div>Loading token...</div>;
  }

  const svgContent = tokenData ? Buffer.from(tokenData.image.split(",")[1], "base64").toString() : "";
  const blob = new Blob([svgContent], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  return (
    <div className="card card-compact w-48 bg-base-100 shadow-xl">
      <figure>
        {svgContent && (
          <a className="block w-full" href={url} target="_blank" rel="noopener noreferrer">
            <ShadowSvg svgContent={svgContent} width="100%" height="100%" />
          </a>
        )}
      </figure>
      <div className="card-body">
        <h2 className="card-title" style={{ wordBreak: "break-all" }}>
          Token #{tokenId ? tokenId.toString() : ""}
          <span>
            <CopyToClipboard text={tokenId ? tokenId.toString() : ""}>
              <DocumentDuplicateIcon
                className="ml-1.5 text-xl font-normal text-sky-600 h-5 w-5 cursor-pointer"
                aria-hidden="true"
              />
            </CopyToClipboard>
          </span>
        </h2>
        <p style={{ wordBreak: "break-all" }}>{tokenData?.name}</p>
        {locationName ? <address>{locationName}</address> : ""}
      </div>
    </div>
  );
};

export default SkyNftToken;
