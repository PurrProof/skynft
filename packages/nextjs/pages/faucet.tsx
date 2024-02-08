import type { NextPage } from "next";

const Faucet: NextPage = () => {
  return (
    <div className="container mx-auto my-5 p-5 rounded-lg shadow">
      <h1 className="text-3xl font-bold mb-6">Polygon Mumbai Testnet Faucets</h1>
      <p className="mb-4">
        To participate in testing on the SkyNft app, you&apos;ll need test tokens. Below is a list of resources where
        you can obtain Polygon Mumbai testnet tokens. These tokens are necessary for executing transactions on the
        testnet, allowing you to fully explore the features of the SkyNft app without using real assets. Remember,
        transactions on the testnet have no economic value and are meant for testing purposes only.
      </p>

      <ul className="list-disc pl-5">
        <li className="mb-2">
          <a
            href="https://blastapi.io/faucets/polygon-mumbai"
            className="text-blue-600 hover:text-blue-800 visited:text-purple-600"
          >
            BlastAPI.io Faucet for Polygon Mumbai
          </a>
        </li>
        <li className="mb-2">
          <a
            href="https://bwarelabs.com/faucets/polygon-testnet"
            className="text-blue-600 hover:text-blue-800 visited:text-purple-600"
          >
            Bware Labs Faucet for Polygon Testnet
          </a>
        </li>
        <li className="mb-2">
          <a
            href="https://faucet.polygon.technology/"
            className="text-blue-600 hover:text-blue-800 visited:text-purple-600"
          >
            Official Polygon Technology Faucet
          </a>
        </li>
        <li className="mb-2">
          <a href="https://mumbaifaucet.com/" className="text-blue-600 hover:text-blue-800 visited:text-purple-600">
            MumbaiFaucet.com
          </a>
        </li>
        <li className="mb-2">
          <a
            href="https://faucet.quicknode.com/polygon/mumbai"
            className="text-blue-600 hover:text-blue-800 visited:text-purple-600"
          >
            QuickNode Faucet for Polygon Mumbai
          </a>
        </li>
        <li className="mb-2">
          <a
            href="https://www.coingecko.com/learn/polygon-testnet-matic-mumbai-goerli"
            className="text-blue-600 hover:text-blue-800 visited:text-purple-600"
          >
            CoinGecko&apos;s Guide on Polygon Testnet (MATIC Mumbai & Goerli)
          </a>
        </li>
      </ul>
    </div>
  );
};

export default Faucet;
