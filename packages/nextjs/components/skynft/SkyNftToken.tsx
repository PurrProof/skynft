import { useState, useEffect } from 'react';
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import ShadowSvg from './ShadowSvg'; // Adjust the import path as needed

interface SkyNftTokenProps {
  ownerAddress: string;
  index: number;
}

export const SkyNftToken = ({ ownerAddress, index }: SkyNftTokenProps) => {
  const [tokenId, setTokenId] = useState<number | null>(null);
  const [tokenData, setTokenData] = useState<any>(null);

  const { data, isLoading } = useScaffoldContractRead({
    contractName: "SkyNft2",
    functionName: "tokenOfOwnerByIndex",
    args: [ownerAddress, index],
    watch: true,
  });

  const { data: tokenUri } = useScaffoldContractRead({
    contractName: "SkyNft2",
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
        const jsonBase64 = tokenUri.split(',')[1];
        const json = atob(jsonBase64);
        const parsedData = JSON.parse(json);
        setTokenData(parsedData);
      } catch (error) {
        console.error('Error parsing token data:', error);
      }
    }
  }, [tokenUri]);

  if (isLoading) {
    return <div>Loading token...</div>;
  }

  const svgContent = tokenData ? atob(tokenData.image.split(',')[1]) : '';

  return (
    <div>
      {tokenId ? (
        <>
          <p>Token ID: {tokenId}</p>
          <p>Token Name: {tokenData?.name}</p>
          {svgContent && <ShadowSvg svgContent={svgContent} width="100px" height="100px" />}
        </>
      ) : (
        <p>Token not found.</p>
      )}
    </div>
  );
};

export default SkyNftToken;
