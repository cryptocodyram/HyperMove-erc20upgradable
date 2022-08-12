import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import chalk from 'chalk';

const log = console.log;

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  try {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;

    log(chalk.blue(`loading fixtures for HyperBurn`));
    const { deployer } = await getNamedAccounts();

    const HyperBurn = await deploy('HyperBurn', {
      from: deployer,
      args: [],
      log: true,
      autoMine: true,
      skipIfAlreadyDeployed: true,
    });

    log(chalk.green(`HyperBurn deployed with ${HyperBurn.transactionHash} at ${HyperBurn.address}`));
  } catch (err) {
    if (err instanceof Error) {
      log(chalk.red(err.message));
    }
  }
};

export default func;
