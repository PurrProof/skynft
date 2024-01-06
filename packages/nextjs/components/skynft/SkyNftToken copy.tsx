import { useState, useEffect } from 'react';
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";

interface SkyNftTokenProps {
  ownerAddress: string;
  index: number;
}
  
export const SkyNftToken = ({ ownerAddress, index }: SkyNftTokenProps) => {
  const [tokenId, setTokenId] = useState<number | null>(null);

  const { data, isLoading } = useScaffoldContractRead({
    contractName: "SkyNft2",
    functionName: "tokenOfOwnerByIndex",
    args: [ownerAddress, index],
    watch: true,
  });

  useEffect(() => {
    if (data) {
      setTokenId(data.toString());
    }
  }, [data]);

  if (isLoading) {
    return <div>Loading token...</div>;
  }

  return (
    <div>
      {tokenId ? <p>Token ID: {tokenId}</p> : <p>Token not found.</p>}
    </div>
  );
};
