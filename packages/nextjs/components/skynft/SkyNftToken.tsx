import { useState, useEffect } from "react";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import ShadowSvg from "./ShadowSvg";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { DocumentDuplicateIcon } from "@heroicons/react/24/outline";

interface SkyNftTokenProps {
  ownerAddress: string;
  index: number;
}

export const SkyNftToken = ({ ownerAddress, index }: SkyNftTokenProps) => {
  const [tokenId, setTokenId] = useState<number | null>(null);
  const [tokenData, setTokenData] = useState<any>(null);

  const { data, isLoading } = useScaffoldContractRead({
    contractName: "SkyNft",
    functionName: "tokenOfOwnerByIndex",
    args: [ownerAddress, index],
    watch: true,
  });

  const { data: tokenUri } = useScaffoldContractRead({
    contractName: "SkyNft",
    functionName: "tokenURI",
    args: [tokenId],
    watch: tokenId !== null,
  });

  useEffect(() => {
    if (data) {
      setTokenId(data.toString());
    }
  }, [data]);

  useEffect(() => {
    if (tokenUri) {
      try {
        const jsonBase64 = tokenUri.split(",")[1];
        const json = atob(jsonBase64);
        const parsedData = JSON.parse(json);
        setTokenData(parsedData);
      } catch (error) {
        console.error("Error parsing token data:", error);
      }
    }
  }, [tokenUri]);

  if (isLoading) {
    return <div>Loading token...</div>;
  }

  const svgContent = tokenData ? Buffer.from(tokenData.image.split(",")[1], "base64") : "";
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
          Token #{tokenId}
          <span>
            <CopyToClipboard text={tokenId}>
              <DocumentDuplicateIcon
                className="ml-1.5 text-xl font-normal text-sky-600 h-5 w-5 cursor-pointer"
                aria-hidden="true"
              />
            </CopyToClipboard>
          </span>
        </h2>
        <p style={{ wordBreak: "break-all" }}>{tokenData?.name}</p>
      </div>
    </div>
  );
};

export default SkyNftToken;
