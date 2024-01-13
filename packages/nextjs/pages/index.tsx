import type { NextPage } from "next";
import { MetaHeader } from "~~/components/MetaHeader";
import { SkyNftTokenList } from "~~/components/skynft/SkyNftTokenList";
import { SkyNftCreator } from "~~/components/skynft/SkyNftCreator";

const Home: NextPage = () => {
  return (
    <>
      <MetaHeader />
      <div className="container mx-auto my-5">
        <SkyNftTokenList />
        <SkyNftCreator />
      </div>
    </>
  );
};

export default Home;
