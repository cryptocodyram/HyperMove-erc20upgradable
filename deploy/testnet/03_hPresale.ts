import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
// import chalk from 'chalk';

const log = console.log;

const parse = (value: string, decimals = 18): BigNumber => {
  return ethers.utils.parseUnits(value, decimals);
};

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  try {
    const { deployments, getNamedAccounts } = hre;
    const { deploy, get } = deployments;

    console.log(`loading fixtures for HyperMovePresaleUpgradeable`);
    const { deployer } = await getNamedAccounts();

    const hMove = await get("HyperMoveUpgradeable");
    const busd = await get("BUSDUpgradeable");

    // console.log({ deployer });

    const HyperMovePresaleUpgradeable = await deploy(
      "HyperMovePresaleUpgradeable",
      {
        from: deployer,
        proxy: {
          owner: deployer,
          proxyContract: "OpenZeppelinTransparentProxy",
          execute: {
            init: {
              methodName: "__HyperMovePresaleUpgradeable_init",
              args: [
                hMove.address,
                busd.address,
                100,
                parse("100"),
                parse("3000"),
                parse("50000"),
                "0xA194E186267FdD49E2Ef9B01AD143768DC75E2c4",
              ],
            },
          },
        },
        args: [],
        log: true,
        autoMine: true,
        skipIfAlreadyDeployed: true,
      }
    );

    log(
      `HyperMovePresaleUpgradeable deployed with ${HyperMovePresaleUpgradeable.transactionHash} at ${HyperMovePresaleUpgradeable.address}`
    );
  } catch (err) {
    if (err instanceof Error) {
      log(err.message);
    }
  }
};

export default func;
