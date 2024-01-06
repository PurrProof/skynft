import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import { SkyNftToken } from './SkyNftToken'; // Adjust the path as necessary

export const SkyNftTokenList = () => {
  const { address } = useAccount();
  const [tokenIndexes, setTokenIndexes] = useState<number[]>([]);

  const { data: balance } = useScaffoldContractRead({
    contractName: "SkyNft2",
    functionName: "balanceOf",
    args: [address],
    watch: true,
  });

  useEffect(() => {
    // Reset tokenIndexes when the address changes
    setTokenIndexes([]);

    if (address) {
      // If there's an address, fetch the token IDs
      const newTokenIndexes = balance ? [...Array(balance).keys()] : [];
      setTokenIndexes(newTokenIndexes);
    }
  }, [address, balance]);
  
  return (
    <div>
      <h3>Your SkyNft Tokens</h3>
      {tokenIndexes.length === 0 ? (
        <p>You currently have no tokens.</p>
      ) : (
        tokenIndexes.map((index) => (
          <SkyNftToken key={index} ownerAddress={address} index={index} />
        ))
      )}
    </div>
  );
};
