"use strict";

import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { deployments, ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

import { EncryptedPredictionPoll } from "../types";

type Signers = {
  operator: HardhatEthersSigner;
};

describe("EncryptedPredictionPollSepolia", function () {
  let signers: Signers;
  let contract: EncryptedPredictionPoll;
  let address: string;
  let step = 0;
  let steps = 0;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn("EncryptedPredictionPollSepolia test suite must run on Sepolia with the live FHEVM");
      this.skip();
    }

    try {
      const deployment = await deployments.get("EncryptedPredictionPoll");
      address = deployment.address;
      contract = await ethers.getContractAt("EncryptedPredictionPoll", deployment.address);
    } catch (err) {
      (err as Error).message += ". Deploy the contract first: 'npx hardhat deploy --network sepolia'";
      throw err;
    }

    const accounts: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { operator: accounts[0] };
  });

  beforeEach(() => {
    step = 0;
    steps = 0;
  });

  it("submits an encrypted vote and decrypts tally growth", async function () {
    this.timeout(5 * 60 * 1000);
    steps = 10;

    progress("Encrypting option index 0");
    const encryptedVote = await fhevm.createEncryptedInput(address, signers.operator.address).add32(0).encrypt();

    progress("Submitting encrypted ballot");
    const tx = await contract
      .connect(signers.operator)
      .submitEncryptedVote(encryptedVote.handles[0], encryptedVote.inputProof);
    await tx.wait();

    progress("Reading encrypted tally for option 0");
    const encryptedTally = await contract.getEncryptedTally(0);
    expect(encryptedTally).to.not.eq(ethers.ZeroHash);

    progress("Decrypting tally through local CLI");
    const clearTally = await fhevm.userDecryptEuint(FhevmType.euint32, encryptedTally, address, signers.operator);

    progress(`Clear tally retrieved: ${clearTally}`);
    expect(clearTally >= 1).to.eq(true);
  });
});
