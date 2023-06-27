import { deployments, getNamedAccounts } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  if (hre.network.name !== "hardhat") {
    console.log(
      `Deploying RedstoneOracle to ${hre.network.name}. Hit ctrl + c to abort`
    );
  }

  const { deploy } = deployments;
  const { deployer, dedicatedMsgSender } = await getNamedAccounts();

  await deploy("Lottery", {
    from: deployer,
    log: hre.network.name !== "hardhat",
    args: [dedicatedMsgSender],
  });
};

export default func;

func.tags = ["Lottery"];
