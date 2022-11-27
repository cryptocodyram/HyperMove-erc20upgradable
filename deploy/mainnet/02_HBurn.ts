import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
// import chalk from 'chalk';

const log = console.log;

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  try {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;

    console.log(`loading fixtures for HyperBurnUpgradeable`);
    const { deployer } = await getNamedAccounts();

    // console.log({ deployer });

    const HyperBurnUpgradeable = await deploy("HyperBurnUpgradeable", {
      from: deployer,
      proxy: {
        owner: deployer,
        proxyContract: "OpenZeppelinTransparentProxy",
        execute: {
          init: {
            methodName: "initialize",
            args: [],
          },
        },
      },
      args: [],
      log: true,
      autoMine: true,
      skipIfAlreadyDeployed: true,
    });

    log(
      `HyperBurnUpgradeable deployed with ${HyperBurnUpgradeable.transactionHash} at ${HyperBurnUpgradeable.address}`
    );
  } catch (err) {
    if (err instanceof Error) {
      log(err.message);
    }
  }
};

export default func;
