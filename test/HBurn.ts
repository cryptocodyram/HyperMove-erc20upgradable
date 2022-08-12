import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, ContractFactory } from "ethers";
import { ethers, upgrades } from "hardhat";
import { HyperBurnUpgradeable } from "../typechain-types";
import { Address, bufferToHex, fromRpcSig } from "ethereumjs-util";

const format = (value: BigNumber, decimals = 18): number => {
    return parseInt(ethers.utils.formatUnits(value, decimals));
};

const parse = (value: string, decimals = 18): BigNumber => {
    return ethers.utils.parseUnits(value, decimals);
};

const _deadline = async () => {
    // block time stamp
    const blockNumber = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);
    const blockTimeStamp = block.timestamp;

    return blockTimeStamp + 15 * 60;
};

const ZERO_ADDRESS: string = "0x0000000000000000000000000000000000000000";

describe("HyperBurnUpgradeable Token", () => {
    let hBurn: HyperBurnUpgradeable;
    // signer
    let owner: SignerWithAddress;
    let address1: SignerWithAddress;
    let address2: SignerWithAddress;
    let address3: SignerWithAddress;

    before("deployment", async () => {
        // get signer
        [ owner, address1, address2, address3] = await ethers.getSigners();

        let factory: ContractFactory = await ethers.getContractFactory(
            "HyperBurnUpgradeable"
        )

        hBurn = (await upgrades.deployProxy(factory, [])) as HyperBurnUpgradeable;
    })

    describe("hBurn read only functions", () => {
        it("#name", async () => {
            expect(await hBurn.name()).to.be.equals("HyperBurn");
        })
        it("#symbol", async () => {
            expect(await hBurn.symbol()).to.be.equals("HBurn");
        })
        it("#decimals", async () => {
            expect(await hBurn.decimals()).to.be.equals(18);
        })
        it("#decimals", async () => {
            expect(await hBurn.totalSupply()).to.be.equals(0);
        })
        it("#balanceOf", async () => {
            expect(await hBurn.balanceOf(address1.address)).to.be.equals(0);
        })
    })

    describe("hBurn - mint and burn", () => {
        it("#mint - 1 Billion token", async () => {
            await expect(hBurn.connect(owner)
                .mint(owner.address, parse('1000000000')))
                .to.be.emit(hBurn, "Transfer")
                .withArgs(ZERO_ADDRESS, owner.address, parse('1000000000'))
        })
        it("#burn - 500 million token", async () => {
            await expect(hBurn.connect(owner)
                .burn(owner.address, parse('500000000')))
                .to.be.emit(hBurn, "Transfer")
                .withArgs(owner.address, ZERO_ADDRESS, parse('500000000'))
        })
        it("#totalSupply - 500 million tokens", async () => {
            expect(await hBurn.totalSupply()).to.be.equals(parse('500000000'))
        })
    })
})