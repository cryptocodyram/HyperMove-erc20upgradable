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

    // const hMove = await get("HyperMoveUpgradeable");
    // const busd = await get("BUSDUpgradeable");

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
                "0x5cAcd251548940283e4EC9Bff383EEd4f92Dd930", // busd
                "0xa06922220dbEC7784B672E3A144F8B2F3B182f68", //hMove
                200, // per usd ufarm
                parse("100"), // min
                parse("3000"), // max
                parse("50000"), // purchasecap
                "0xA194E186267FdD49E2Ef9B01AD143768DC75E2c4", // admin wallet
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
