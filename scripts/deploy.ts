import { ethers, upgrades } from "hardhat";

async function main() {
  let factory = await ethers.getContractFactory("HyperMoveUpgradeable");
  let hmove = await upgrades.deployProxy(factory);

  // wait for deployment
  await hmove.deployed();
  console.log(`HyperMoveUpgradeable Token Address is ${hmove.address}`);
}

main();
