import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, ContractFactory } from "ethers";
import { ethers, upgrades } from "hardhat";
import {
  BUSDUpgradeable,
  HyperMovePresaleUpgradeable,
  HyperMoveUpgradeable,
} from "../typechain-types";
// import { Address, bufferToHex, fromRpcSig } from "ethereumjs-util";

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

describe("HyperMovePresaleUpgradeable", () => {
  let hPresale: HyperMovePresaleUpgradeable;
  let hMove: HyperMoveUpgradeable;
  let bUSD: BUSDUpgradeable;
  // signer
  let owner: SignerWithAddress;
  let address1: SignerWithAddress;
  let address2: SignerWithAddress;
  let address3: SignerWithAddress;

  before("deployment", async () => {
    // get signer
    [owner, address1, address2, address3] = await ethers.getSigners();

    let HyperMovefactory: ContractFactory = await ethers.getContractFactory(
      "HyperMoveUpgradeable"
    );
    hMove = (await upgrades.deployProxy(
      HyperMovefactory,
      []
    )) as HyperMoveUpgradeable;

    let bUSDfactory: ContractFactory = await ethers.getContractFactory(
      "BUSDUpgradeable"
    );
    bUSD = (await upgrades.deployProxy(bUSDfactory, [])) as BUSDUpgradeable;

    let factory: ContractFactory = await ethers.getContractFactory(
      "HyperMovePresaleUpgradeable"
    );

    /**
     * @notice need params
     *  _busd,
     *  _hyperMove,
     *  _hyperMovePrice,
     *  _minAllocation,
     *  _maxAllocation,
     *  _purchaseCap,
     *  _adminWallet
     */

    hPresale = (await upgrades.deployProxy(
      factory,
      [
        bUSD.address,
        hMove.address,
        2,
        parse("100"),
        parse("3000"),
        parse("50000"),
        "0xA194E186267FdD49E2Ef9B01AD143768DC75E2c4",
      ],
      {
        initializer: "__HyperMovePresaleUpgradeable_init",
      }
    )) as HyperMovePresaleUpgradeable;
  });

  describe("HyperMovePresaleUpgradeable approve and buy", () => {
    it("switchSalePhase", async () => {
      await expect(hPresale.switchSalePhase(true));
    });

    it("#transfer - BUSD", async () => {
      await expect(bUSD.transfer(address1.address, parse("10000"))).to.be.emit(
        bUSD,
        "Transfer"
      );
      await expect(bUSD.transfer(address2.address, parse("10000"))).to.be.emit(
        bUSD,
        "Transfer"
      );
      await expect(bUSD.transfer(address3.address, parse("10000"))).to.be.emit(
        bUSD,
        "Transfer"
      );
      await expect(
        hMove.transfer(hPresale.address, parse("100000"))
      ).to.be.emit(hMove, "Transfer");
    });

    it("#approve - BUSD", async () => {
      await expect(
        bUSD.connect(address1).approve(hPresale.address, parse("3500"))
      ).to.be.emit(bUSD, "Approval");
      await expect(
        bUSD.connect(address2).approve(hPresale.address, parse("3500"))
      ).to.be.emit(bUSD, "Approval");
      await expect(
        bUSD.connect(address3).approve(hPresale.address, parse("3500"))
      ).to.be.emit(bUSD, "Approval");
    });

    it("#allowance read", async () => {
      expect(await bUSD.allowance(address1.address, hPresale.address)).to.equal(
        parse("3500")
      );
      expect(await bUSD.allowance(address2.address, hPresale.address)).to.equal(
        parse("3500")
      );
      expect(await bUSD.allowance(address3.address, hPresale.address)).to.equal(
        parse("3500")
      );
    });

    it("#balance", async () => {
      expect(await bUSD.balanceOf(address1.address)).to.equal(parse("10000"));
      expect(await bUSD.balanceOf(address2.address)).to.equal(parse("10000"));
      expect(await bUSD.balanceOf(address3.address)).to.equal(parse("10000"));
    });

    it("#buy - hMove token", async () => {
      await expect(
        hPresale.connect(address1).buy(parse("35"))
      ).to.be.revertedWith("Buy Failed");
      await expect(
        hPresale.connect(address1).buy(parse("3200"))
      ).to.be.revertedWith("Buy Failed");
      await expect(hPresale.connect(address1).buy(parse("3000")));
      await expect(hPresale.connect(address2).buy(parse("3000")));
      await expect(hPresale.connect(address3).buy(parse("2500")));
    });

    it("#userPurchases", async () => {
      expect(await hPresale.userPurchases(address1.address)).to.equal(
        parse("3000")
      );
      expect(await hPresale.userPurchases(address2.address)).to.equal(
        parse("3000")
      );
      expect(await hPresale.userPurchases(address3.address)).to.equal(
        parse("2500")
      );
    });

    it("#claim - fail before sale end", async () => {
      await expect(
        hPresale.connect(address1).claimHyperMove()
      ).to.be.revertedWith("Sale Not Ends Yet");
    });

    it("#set - sale end", async () => {
      await expect(hPresale.setSaleEnds(true));
      expect(await hPresale.isSaleEnd()).to.be.true;
    });

    it("#claim", async () => {
      await expect(hPresale.connect(address1).claimHyperMove()).to.be.emit(
        hPresale,
        "Claim"
      );
    });

    it("#balance", async () => {
      expect(await hMove.balanceOf(address1.address)).to.equal(parse("6000"));
    });
  });
});
