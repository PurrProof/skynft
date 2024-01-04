import { SkyProjectionPacker } from "@SkyNft/sdk";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/dist/src/signer-with-address";

import type { Greeter } from "../types/";

type Fixture<T> = () => Promise<T>;

declare module "mocha" {
  export interface Context {
    greeter: Greeter;
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
    signers: Signers;
    packer: SkyProjectionPacker;
  }
}

export interface Signers {
  owner: SignerWithAddress;
  admin: SignerWithAddress;
}
