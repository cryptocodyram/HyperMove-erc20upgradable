import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, ContractFactory } from "ethers";
import { ethers, upgrades } from "hardhat";
import { Vibe } from "../typechain-types";
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

const _permit = async (
  vibe: Vibe,
  owner: SignerWithAddress,
  ownerAddr: string,
  spender: string,
  deadline: number
) => {
  // grab the chainId
  let { chainId } = await ethers.provider.getNetwork();

  // Struct Type
  const Types = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };

  // Domain Data
  const domainData = {
    name: "Vibe",
    version: "1",
    chainId: chainId,
    verifyingContract: vibe.address,
  };

  // get the current nonce
  const nonce = await vibe.nonces(owner.address);

  // construct permit data message
  const data = {
    owner: owner.address,
    spender: spender,
    value: parse("5000"),
    nonce: nonce,
    deadline: deadline,
  };

  const signature = await owner._signTypedData(domainData, Types, data);

  // derive v,r and s
  const signatureData = fromRpcSig(signature);

  const v = signatureData.v;
  const r = bufferToHex(signatureData.r);
  const s = bufferToHex(signatureData.s);

  return await vibe.connect(owner).permit(ownerAddr, spender, parse("5000"), deadline, v, r, s);
};

const _delegateBySig = async (
  vibe: Vibe,
  delegator: SignerWithAddress,
  addr: string,
  delegatee: string,
  expiry: number
) => {
  // chainId
  const { chainId } = await ethers.provider.getNetwork();

  // get the types
  const Types = {
    Delegation: [
      { name: "delegatee", type: "address" },
      { name: "nonce", type: "uint256" },
      { name: "expiry", type: "uint256" },
    ],
  };

  // domain data
  const domainData = {
    name: "Vibe",
    version: "1",
    chainId: chainId,
    verifyingContract: vibe.address,
  };

  const nonce = await vibe.nonces(addr);

  const delegationDataMessage = {
    delegatee: delegatee,
    nonce: nonce,
    expiry: expiry,
  };

  const signature = await delegator._signTypedData(domainData, Types, delegationDataMessage);

  const signatureData = fromRpcSig(signature);

  const v = signatureData.v;
  const r = bufferToHex(signatureData.r);
  const s = bufferToHex(signatureData.s);

  return await vibe.connect(delegator).delegateBySig(delegatee, nonce, expiry, v, r, s);
};

const ZERO_ADDRESS: string = "0x0000000000000000000000000000000000000000";

describe("Vibe Token", () => {
  // vibe contract
  let vibe: Vibe;
  // signers
  let owner: SignerWithAddress;
  let signer1: SignerWithAddress;
  let signer2: SignerWithAddress;
  let signer3: SignerWithAddress;

  before("deployment", async () => {
    // get signers
    [owner, signer1, signer2, signer3] = await ethers.getSigners();

    let factory: ContractFactory = await ethers.getContractFactory("Vibe");
    vibe = (await upgrades.deployProxy(factory, [])) as Vibe;

    // wait for deployment
    await vibe.deployed();
  });

  describe("vibe read only functions", () => {
    it("#name", async () => {
      expect(await vibe.name()).to.be.equal("Vibe");
    });
    it("#symbol", async () => {
      expect(await vibe.symbol()).to.be.equal("V");
    });
    it("#decimals", async () => {
      expect(await vibe.decimals()).to.equal(18);
    });
    it("#totalSupply", async () => {
      expect(format(await vibe.totalSupply())).to.equal(1000000000);
    });

    it("#balanceOf", async () => {
      expect(format(await vibe.balanceOf(owner.address))).to.equal(1000000000);
    });
  });

  describe("vibe transfer and allowances, transferFrom,pause & unpause", () => {
    it("#approve", async () => {
      await expect(vibe.connect(owner).approve(signer1.address, parse("200")))
        .to.be.emit(vibe, "Approval")
        .withArgs(owner.address, signer1.address, parse("200"));
    });

    it("#allowance", async () => {
      expect(format(await vibe.allowance(owner.address, signer1.address))).to.be.equal(200);
    });

    it("#increaseAllowance", async () => {
      await expect(vibe.connect(owner).increaseAllowance(signer1.address, parse("300")))
        .to.be.emit(vibe, "Approval")
        .withArgs(owner.address, signer1.address, parse("500"));

      // check signer1 allowance will be increase
      expect(format(await vibe.allowance(owner.address, signer1.address))).to.be.equal(500);
    });

    it("#decreaseAllowance", async () => {
      await expect(vibe.connect(owner).decreaseAllowance(signer1.address, parse("300")))
        .to.be.emit(vibe, "Approval")
        .withArgs(owner.address, signer1.address, parse("200"));

      // check signer1 allowance will be increase
      expect(format(await vibe.allowance(owner.address, signer1.address))).to.be.equal(200);
    });

    it("#transferFrom", async () => {
      // when insufficient allowance
      await expect(
        vibe.connect(signer1).transferFrom(owner.address, signer1.address, parse("400"))
      ).to.be.revertedWith("ERC20: insufficient allowance");

      // signer1 will able to reedem spending 100 vibe tokens
      await expect(vibe.connect(signer1).transferFrom(owner.address, signer1.address, parse("100")))
        .to.be.emit(vibe, "Transfer")
        .withArgs(owner.address, signer1.address, parse("100"));

      // check signer1 allowance
      expect(format(await vibe.allowance(owner.address, signer1.address))).to.be.equal(100);

      // check owner balance
      expect(format(await vibe.balanceOf(owner.address))).to.be.equal(999999900);
    });

    it("#pause", async () => {
      // pause cn be run by only owner
      await expect(vibe.connect(signer2).pause()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );

      // now pause
      await expect(vibe.connect(owner).pause()).to.be.emit(vibe, "Paused").withArgs(owner.address);
    });

    it("#transfer", async () => {
      // trasnfer will be failed because contract is paused
      await expect(vibe.connect(signer1).transfer(owner.address, parse("100"))).to.be.revertedWith(
        "Pausable: paused"
      );

      // unpause the contract
      await expect(vibe.connect(signer1).unpause()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
      await expect(vibe.connect(owner).unpause())
        .to.be.emit(vibe, "Unpaused")
        .withArgs(owner.address);

      // when exceed balance
      await expect(vibe.connect(signer1).transfer(owner.address, parse("300"))).to.be.revertedWith(
        "ERC20: transfer amount exceeds balance"
      );

      // transfer exact amount
      await expect(vibe.connect(signer1).transfer(owner.address, parse("100")))
        .to.be.emit(vibe, "Transfer")
        .withArgs(signer1.address, owner.address, parse("100"));

      // check both balances
      expect(await vibe.balanceOf(owner.address)).to.be.equal(parse("1000000000"));
      expect(await vibe.balanceOf(signer1.address)).to.be.equal(0);
    });
  });

  describe("vibe governance", () => {
    it("#delegate", async () => {
      // transfer some governance tokens to signer2
      await vibe.connect(owner).transfer(signer2.address, parse("500"));

      // delegate
      await expect(vibe.connect(signer2).delegate(signer1.address))
        .to.be.emit(vibe, "DelegateChanged")
        .withArgs(signer2.address, ZERO_ADDRESS, signer1.address);
    });

    it("#delegates", async () => {
      expect(await vibe.delegates(signer2.address)).to.be.equal(signer1.address);
    });

    it("#getCurrentVotes", async () => {
      expect(format(await vibe.getVotes(signer1.address))).to.be.equal(500);
    });

    it("#numCheckpoints", async () => {
      expect(await vibe.numCheckpoints(signer1.address)).to.be.equal(1);
    });

    it("#checkpoints", async () => {
      // delegate
      await vibe.connect(owner).transfer(signer3.address, parse("700"));
      await vibe.connect(signer3).delegate(signer1.address);

      // number of check points
      expect(await vibe.numCheckpoints(signer1.address)).to.be.equal(2);
      // in first check point there is 500 vibe tokens
      const checkpoints = await vibe.checkpoints(signer1.address, 0);
      expect(format(checkpoints.votes)).to.be.equal(500);

      // in second check point there is 500 vibe tokens
      const checkpoints2nd = await vibe.checkpoints(signer1.address, 1);
      expect(format(checkpoints2nd.votes)).to.be.equal(1200);
    });
  });

  describe("Approval with permit", () => {
    it("#permit failed on sig expires", async () => {
      let deadline = await _deadline();
      // increase the time
      await ethers.provider.send("evm_increaseTime", [18 * 60]);

      await expect(
        _permit(vibe, owner, owner.address, signer3.address, deadline)
      ).to.be.revertedWith("ERC20Permit: expired deadline");
    });

    it("#permit ecrecover failed", async () => {
      let deadline = await _deadline();
      await expect(
        _permit(vibe, owner, signer1.address, signer3.address, deadline)
      ).to.be.revertedWith("ERC20Permit: invalid signature");
    });

    it("#permit", async () => {
      let deadline = await _deadline();
      await expect(_permit(vibe, owner, owner.address, signer3.address, deadline))
        .to.be.emit(vibe, "Approval")
        .withArgs(owner.address, signer3.address, parse("5000"));
      // check signer3 allowance
      expect(format(await vibe.allowance(owner.address, signer3.address))).to.be.equal(5000);
    });
  });

  describe("vibe mint tokens", () => {
    it("#mint", async () => {
      // mint function can be executed by only owner
      await expect(vibe.connect(signer2).mint(signer2.address, parse("500"))).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );

      // owner mints 1000 vibe tokens to signer2 wallet address
      await vibe.connect(owner).mint(signer2.address, parse("500"));

      // check balance of signer2
      expect(format(await vibe.balanceOf(signer2.address))).to.be.equal(1000);

      // get the votes of signer1
      expect(format(await vibe.getVotes(signer1.address))).to.be.equal(1700);
    });
  });

  describe("vibe burn tokens", () => {
    it("#burn", async () => {
      // caller is not the owner
      await expect(vibe.connect(signer2).burn(signer2.address, parse("500"))).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );

      // insuffient tokens to burn
      await expect(vibe.connect(owner).burn(signer2.address, parse("1100"))).to.be.revertedWith(
        "ERC20: burn amount exceeds balance"
      );

      // burn the exact tokens
      await vibe.connect(owner).burn(signer2.address, parse("500"));

      // check signer2 balance
      expect(format(await vibe.balanceOf(signer2.address))).to.be.equal(500);

      // check the votes as well
      expect(format(await vibe.getVotes(signer1.address))).to.be.equal(1200);
    });
  });

  describe("vibe other read only functions", () => {
    it("#getPastVotes", async () => {
      const blockNumber = await ethers.provider.getBlockNumber();
      await expect(vibe.getPastVotes(signer1.address, blockNumber + 2500)).to.be.revertedWith(
        "ERC20Votes: block not yet mined"
      );
    });

    it("#nonce", async () => {
      expect(await vibe.nonces(signer3.address)).to.be.equal(0);
    });
  });

  describe("vibe _delegateBySig", () => {
    it("#delegateBySig failed on sig expires", async () => {
      let deadline = await _deadline();
      await ethers.provider.send("evm_increaseTime", [18 * 60]);
      await expect(
        _delegateBySig(vibe, owner, owner.address, signer3.address, deadline)
      ).be.revertedWith("ERC20Votes: signature expired");
    });

    it("#delegateBySig", async () => {
      let deadline = await _deadline();

      let balanceOf_owner = await vibe.balanceOf(owner.address);
      await expect(_delegateBySig(vibe, owner, owner.address, signer3.address, deadline)).be.emit(
        vibe,
        "DelegateChanged"
      );

      // check the delegates
      expect(await vibe.delegates(owner.address)).to.be.eql(signer3.address);
      // check vote tokens

      expect(format(await vibe.getVotes(signer3.address))).to.be.equal(format(balanceOf_owner));
    });
  });

  describe("HMove ownable", async () => {
    it("#transferOwnership", async () => {
      expect(await vibe.connect(owner).transferOwnership(signer1.address))
        .to.be.emit(vibe, "OwnershipTransferred")
        .withArgs(owner.address, signer1.address);
    });

    it("#owner", async () => {
      expect(await vibe.owner()).to.be.eql(signer1.address);
    });

    it("#renounceOwnership", async () => {
      expect(await vibe.connect(signer1).renounceOwnership())
        .to.be.emit(vibe, "OwnershipTransferred")
        .withArgs(signer1.address, ZERO_ADDRESS);

      // check the ownership
      expect(await vibe.owner()).to.be.eql(ZERO_ADDRESS);
    });
  });
});