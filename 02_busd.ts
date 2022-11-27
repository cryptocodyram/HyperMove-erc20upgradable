// import { HardhatRuntimeEnvironment } from "hardhat/types";
// import { DeployFunction } from "hardhat-deploy/types";
// // import chalk from 'chalk';

// const log = console.log;

// const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
//   try {
//     const { deployments, getNamedAccounts } = hre;
//     const { deploy } = deployments;

//     console.log(`loading fixtures for BUSDUpgradeable`);
//     const { deployer } = await getNamedAccounts();

//     // console.log({ deployer });

//     const BUSDUpgradeable = await deploy("BUSDUpgradeable", {
//       from: deployer,
//       proxy: {
//         owner: deployer,
//         proxyContract: "OpenZeppelinTransparentProxy",
//         execute: {
//           init: {
//             methodName: "initialize",
//             args: [],
//           },
//         },
//       },
//       args: [],
//       log: true,
//       autoMine: true,
//       skipIfAlreadyDeployed: true,
//     });

//     log(
//       `BUSDUpgradeable deployed with ${BUSDUpgradeable.transactionHash} at ${BUSDUpgradeable.address}`
//     );
//   } catch (err) {
//     if (err instanceof Error) {
//       log(err.message);
//     }
//   }
// };

// export default func;

export {};
