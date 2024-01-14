import { parseEther } from "viem";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { ConstellationFigures, SkyProjection, SkyProjectionPacker, StarNames } from "@SkyNft/sdk";

export const SkyNftMint = async (apiResponseData, accountAddress) => {
  if (!accountAddress) {
    console.error("User is not connected to a wallet");
    return;
  }

  const starNames = new StarNames();
  const constlFigures = new ConstellationFigures();
  const packer = new SkyProjectionPacker(constlFigures, starNames);
  const skyProjection = new SkyProjection(apiResponseData, constlFigures);

  try {
    const { writeAsync } = useScaffoldContractWrite({
      contractName: "SkyNft",
      functionName: "mint",
      args: [accountAddress, ...packer.pack(skyProjection)],
      value: parseEther("0"),
      onBlockConfirmation: txnReceipt => {
        console.log("📦 Transaction blockHash", txnReceipt.blockHash);
      },
    });

    const txnReceipt = await writeAsync();
    console.log("Transaction successful", txnReceipt);
    return txnReceipt;
  } catch (error) {
    console.error("Transaction failed", error);
    throw error;
  }
};
