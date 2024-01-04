import { expect } from "chai";
import { ContractTransactionResponse, EventLog } from "ethers";
import fs from "fs";
import { ethers } from "hardhat";

import { ConstellationFigures, SkyProjection, SkyProjectionPacker, StarNames } from "../lib/";
import type { SkyNft2, SkyNftSvgGenerator, SkyNftSvgStarNames } from "../types";
import type { Signers } from "./types";
import { getSvgFromTokenUri } from "./utils";

describe("SkyNft2", function () {
  const TOKEN_NAME = "OnChain SkyMap";
  const TOKEN_SYMBOL = "OSKY";
  let skynft: SkyNft2;
  let svgGen: SkyNftSvgGenerator;
  let svgGenStarNames: SkyNftSvgStarNames;
  let skyProjection: SkyProjection;

  this.timeout(60_000);

  before(async function () {
    this.signers = {} as Signers;

    const signers = await ethers.getSigners();
    this.signers.owner = signers[0];

    const constlFigures = new ConstellationFigures();
    const starNames = new StarNames();

    //packer
    this.packer = new SkyProjectionPacker(constlFigures, starNames);

    // deploy libraries
    const SkyNftSvgStarNames = await ethers.getContractFactory("SkyNftSvgStarNames");
    svgGenStarNames = (await SkyNftSvgStarNames.deploy()) as SkyNftSvgStarNames;
    await svgGenStarNames.waitForDeployment();

    // deploy svg generator
    const SvgFact = await ethers.getContractFactory("SkyNftSvgGenerator", {
      libraries: {
        SkyNftSvgStarNames: await svgGenStarNames.getAddress(),
      },
    });
    svgGen = (await SvgFact.deploy()) as SkyNftSvgGenerator;
    await svgGen.waitForDeployment(); // Wait for the deployment transaction

    // deploy the SkyNft contract
    const SkyNftFact = await ethers.getContractFactory("SkyNft2");
    skynft = (await SkyNftFact.deploy(TOKEN_NAME, TOKEN_SYMBOL, await svgGen.getAddress())) as SkyNft2;
    await skynft.waitForDeployment(); // Wait for the deployment transaction

    // prepare api response
    const apiResponse = fs.readFileSync(__dirname + "/api_response_0.json", "utf-8");

    // init sky projection object
    skyProjection = new SkyProjection(JSON.parse(apiResponse), constlFigures);
  });

  it("should create svg", async function () {
    const tmp = this.packer.pack(skyProjection);
    console.log(tmp);
    console.log(tmp[5].join(","));

    const response: ContractTransactionResponse = await skynft.mint(
      await this.signers.owner.getAddress(),
      ...this.packer.pack(skyProjection),
      { gasLimit: 3_000_000 },
    );

    const txReceipt = await response.wait();
    if (!txReceipt || !txReceipt.logs) {
      expect.fail("Tx receipt is null");
    }
    const transferEvent = txReceipt.logs[0] as EventLog;
    const [, , mintedTokenId] = transferEvent.args;

    expect(await skynft.ownerOf(mintedTokenId)).to.equal(await this.signers.owner.getAddress());

    const tokenUriDataJson = await skynft.tokenURI(mintedTokenId);
    const svg = await getSvgFromTokenUri(tokenUriDataJson);
    console.log(svg);
    expect(svg).to.include("<svg");
    fs.writeFileSync("build/token1.svg", svg, "utf-8");
  });

  it("should revert mint if token id already exists", async function () {
    await expect(
      skynft.mint(await this.signers.owner.getAddress(), ...this.packer.pack(skyProjection), { gasLimit: 3_000_000 }),
    ).to.be.reverted;
    // this does not work with anvil
    //).to.be.revertedWithCustomError(skynft, "ERC721TokenExists");
    //.withArgs(tokenId);
  });
});
