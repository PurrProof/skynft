import Link from "next/link";
import type { NextPage } from "next";
import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { MetaHeader } from "~~/components/MetaHeader";
import { SkyNftTest } from "~~/components/skynft/SkyNftTest";
import { SkyNftTokenList } from "~~/components/skynft/SkyNftTokenList";

const SkyNft: NextPage = () => {
  return (
    <>
      <MetaHeader />

      <div>Hello, World!</div>
      <SkyNftTokenList />
      <SkyNftTest />
    </>
  );
};

export default SkyNft;
