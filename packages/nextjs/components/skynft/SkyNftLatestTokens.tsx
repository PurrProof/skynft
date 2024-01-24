import { useEffect, useState } from "react";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import { SkyNftToken } from "./SkyNftToken";

export const SkyNftLatestTokens = () => {
  const [tokenIndexes, setTokenIndexes] = useState<number[]>([]);

  const { data: totalSupply } = useScaffoldContractRead({
    contractName: "SkyNft",
    functionName: "totalSupply",
    args: undefined,
    watch: true,
  });

  useEffect(() => {
    setTokenIndexes([]);
    const N = 5;
    const newTokenIndexes = totalSupply ? [...Array(parseInt(totalSupply.toString())).keys()].slice(-N).reverse() : [];
    setTokenIndexes(newTokenIndexes);
  }, [totalSupply]);

  return (
    <div className="mb-10">
      <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">Latest SkyNft Tokens</h2>
      {tokenIndexes.length === 0 ? (
        <p>There are no minted tokens yet.</p>
      ) : (
        <div className="flex flex-row gap-5">
          {tokenIndexes.map(index => (
            <SkyNftToken key={index} ownerAddress={""} index={index} />
          ))}
        </div>
      )}
    </div>
  );
};
