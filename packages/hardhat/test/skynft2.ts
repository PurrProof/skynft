import { ConstellationFigures, SkyProjection, SkyProjectionPacker, StarNames } from "@SkyNft/sdk";
import { expect } from "chai";
import { ContractTransactionResponse, EventLog } from "ethers";
import fs from "fs";
import { ethers } from "hardhat";
import { hardhat } from "viem/chains";

import { TxReceipt } from "../../nextjs/components/scaffold-eth/Contract/TxReceipt";
import type { SkyNft2, SkyNftSvgGenerator, SkyNftSvgStarNames } from "../types";
import type { Signers } from "./types";
import { decodeSvgDataUri } from "./utils";

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
    this.signers.admin = signers[1];

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

  it("should be Ownable by deployer", async function () {
    expect(await skynft.owner()).to.equal(await this.signers.owner.getAddress());
  });

  it("should be Pausable/unpausable by owner", async function () {
    expect(await skynft.paused()).to.be.false;

    const tx1: ContractTransactionResponse = await skynft.pause();
    await expect(await tx1.wait()).to.emit(skynft, "Paused");
    expect(await skynft.paused()).to.be.true;
    if ((await ethers.provider.getNetwork()).name != "anvil")
      //it works bad with anvil
      await expect(
        skynft.mint(await this.signers.owner.getAddress(), ...this.packer.pack(skyProjection), {
          gasLimit: 3_000_000,
        }),
      ).to.be.revertedWithCustomError(skynft, "EnforcedPause");
    await expect(skynft.connect(this.signers.admin).unpause()).to.be.revertedWithCustomError(
      skynft,
      "OwnableUnauthorizedAccount",
    );
    const tx2: ContractTransactionResponse = await skynft.connect(this.signers.owner).unpause();
    await expect(await tx2.wait()).to.emit(skynft, "Unpaused");
    expect(await skynft.paused()).to.be.false;
  });

  it("should create svg", async function () {
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

    // TODO: check tokenUri metadata format/fields
    const tokenUri = await skynft.tokenURI(mintedTokenId);
    const parts = tokenUri.split(",");
    let strMetadata = parts[1];
    if (tokenUri.includes("data:application/json;base64")) {
      strMetadata = Buffer.from(parts[1], "base64").toString("utf-8");
    }
    const jsonMetadata = JSON.parse(decodeURIComponent(strMetadata));

    // check token name
    expect(jsonMetadata.name).to.contain(skyProjection.latitude);
    expect(jsonMetadata.name).to.contain(skyProjection.longitude);
    expect(jsonMetadata.name).to.contain(skyProjection.formatDate());

    // check svg
    if (!jsonMetadata.image) {
      expect.fail("Metadata doesn't contain image field.");
    }
    const svg = await decodeSvgDataUri(jsonMetadata.image);
    //console.log(svg);
    expect(svg).to.include("<svg");
    fs.writeFileSync("build/token1.svg", svg, "utf-8");
  });

  it("should revert mint if token id already exists", async function () {
    const packed = this.packer.pack(skyProjection);
    expect(
      skynft.mint(await this.signers.owner.getAddress(), ...packed, {
        gasLimit: 3_000_000,
      }),
    )
      // this works fine with hardhat
      // this does not work correctly with anvil because anvil has no contract ABI
      .to.be.revertedWithCustomError(skynft, "ERC721TokenExists")
      .withArgs(packed[0]);
  });

  it("should properly enumerate tokens as contract is ERC721Enumerable", async function () {
    const [tokenId] = this.packer.pack(skyProjection);
    expect(await skynft.totalSupply()).to.equal(1);
    expect(await skynft.tokenByIndex(0)).to.equal(tokenId);
    expect(await skynft.tokenOfOwnerByIndex(await this.signers.owner.getAddress(), 0)).to.equal(tokenId);
  });
});
