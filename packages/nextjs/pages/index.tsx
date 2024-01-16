import type { NextPage } from "next";
import { MetaHeader } from "~~/components/MetaHeader";
import { SkyNftCreator, SkyNftUserTokens, SkyNftLatestTokens } from "~~/components/skynft";

const Home: NextPage = () => {
  return (
    <>
      <MetaHeader />
      <div className="container mx-auto my-5">
        <SkyNftUserTokens />
        <SkyNftCreator />
        <SkyNftLatestTokens />
      </div>
    </>
  );
};

export default Home;
