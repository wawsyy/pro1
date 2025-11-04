import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying FHECounter contract...");
  console.log("Deployer address:", deployer);

  const deployedFHECounter = await deploy("FHECounter", {
    from: deployer,
    log: true,
  });

  console.log(`FHECounter contract deployed at: ${deployedFHECounter.address}`);
};
export default func;
func.id = "deploy_fheCounter"; // id required to prevent reexecution
func.tags = ["FHECounter"];
