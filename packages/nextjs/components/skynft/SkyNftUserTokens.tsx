import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import { SkyNftToken } from "./SkyNftToken";

export const SkyNftUserTokens = () => {
  const { address } = useAccount();
  const [tokenIndexes, setTokenIndexes] = useState<number[]>([]);

  const { data: balance } = useScaffoldContractRead({
    contractName: "SkyNft",
    functionName: "balanceOf",
    args: [address],
    watch: true,
  });

  useEffect(() => {
    // Reset tokenIndexes when the address changes
    setTokenIndexes([]);

    if (address) {
      const newTokenIndexes = balance ? [...Array(parseInt(balance)).keys()] : [];
      setTokenIndexes(newTokenIndexes);
    }
  }, [address, balance]);

  return (
    <div className="mb-10">
      <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">Your SkyNft Tokens</h2>
      {tokenIndexes.length === 0 ? (
        <p>You currently have no tokens.</p>
      ) : (
        <div className="flex flex-row gap-5">
          {tokenIndexes.map(index => (
            <SkyNftToken key={index} ownerAddress={address} index={index} />
          ))}
        </div>
      )}
    </div>
  );
};
