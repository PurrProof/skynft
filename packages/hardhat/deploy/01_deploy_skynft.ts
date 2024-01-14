import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deploySkyNft: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy SkyNftSvgStarNames library
  const svgGenStarNames = await deploy("SkyNftSvgStarNames", {
    from: deployer,
    log: true,
    autoMine: true,
  });

  // Deploy SkyNftSvgGenerator with the library
  const svgGen = await deploy("SkyNftSvgGenerator", {
    from: deployer,
    libraries: {
      SkyNftSvgStarNames: svgGenStarNames.address,
    },
    log: true,
    autoMine: true,
  });

  // Deploy SkyNft contract
  const skynft = await deploy("SkyNft", {
    from: deployer,
    args: ["OnChain SkyMap", "OSKY", svgGen.address],
    log: true,
    autoMine: true,
  });

  // Additional deployment logic or interactions can be added here if needed
};

export default deploySkyNft;

deploySkyNft.tags = ["SkyNft"];
