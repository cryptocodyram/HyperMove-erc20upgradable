import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import chalk from 'chalk';

const log = console.log;

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  try {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;

    log(chalk.blue(`loading fixtures for HyperMove`));
    const { deployer } = await getNamedAccounts();

    const HyperMove = await deploy('HyperMove', {
      from: deployer,
      args: [],
      log: true,
      autoMine: true,
      skipIfAlreadyDeployed: true,
    });

    log(chalk.green(`HyperMove deployed with ${HyperMove.transactionHash} at ${HyperMove.address}`));
  } catch (err) {
    if (err instanceof Error) {
      log(chalk.red(err.message));
    }
  }
};

export default func;
