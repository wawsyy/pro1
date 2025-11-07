"use strict";

import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

import { EncryptedPredictionPoll, EncryptedPredictionPoll__factory } from "../types";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  carol: HardhatEthersSigner;
};

const POLL_NAME = "EncryptedPrediction2025";
const POLL_HEADLINE = "Encrypted Polling Predictions";
const POLL_DESCRIPTION = "Forecast the community sentiment surrounding the launch while keeping each ballot private.";
const OPTION_LABELS = ["Early Launch Success", "On-Time Market Entry", "Delayed Release"];
const OPTION_DESCRIPTIONS = [
  "The release beats the schedule and surpasses growth KPIs.",
  "The launch happens on time with steady community momentum.",
  "Unexpected blockers delay the public rollout.",
];
const VOTING_DURATION_SECONDS = BigInt(6 * 60 * 60); // 6 hours

async function deployFixture() {
  const factory = (await ethers.getContractFactory("EncryptedPredictionPoll")) as EncryptedPredictionPoll__factory;
  const contract = (await factory.deploy(
    POLL_NAME,
    POLL_HEADLINE,
    POLL_DESCRIPTION,
    OPTION_LABELS,
    OPTION_DESCRIPTIONS,
    VOTING_DURATION_SECONDS,
  )) as EncryptedPredictionPoll;
  const address = await contract.getAddress();
  return { contract, address };
}

describe("EncryptedPredictionPoll", function () {
  let signers: Signers;
  let contract: EncryptedPredictionPoll;
  let address: string;

  before(async function () {
    const accounts: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: accounts[0],
      alice: accounts[1],
      bob: accounts[2],
      carol: accounts[3],
    };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("EncryptedPredictionPoll unit tests require the FHEVM mock environment");
      this.skip();
    }

    ({ contract, address } = await deployFixture());
  });

  it("initializes poll metadata correctly", async function () {
    const optionCount = Number(await contract.optionCount());
    expect(optionCount).to.eq(OPTION_LABELS.length);

    expect(await contract.voterCount()).to.eq(0n);
    expect(await contract.finalized()).to.eq(false);
    expect(await contract.decryptionPending()).to.eq(false);
  });

  it("records private ballots and produces encrypted tallies", async function () {
    const encAlice = await fhevm.createEncryptedInput(address, signers.alice.address).add32(1).encrypt();
    await (await contract.connect(signers.alice).submitEncryptedVote(encAlice.handles[0], encAlice.inputProof)).wait();

    const encBob = await fhevm.createEncryptedInput(address, signers.bob.address).add32(1).encrypt();
    await (await contract.connect(signers.bob).submitEncryptedVote(encBob.handles[0], encBob.inputProof)).wait();

    const encCarol = await fhevm.createEncryptedInput(address, signers.carol.address).add32(0).encrypt();
    await (await contract.connect(signers.carol).submitEncryptedVote(encCarol.handles[0], encCarol.inputProof)).wait();

    const encryptedTallies: string[] = [];
    for (let i = 0; i < OPTION_LABELS.length; i++) {
      encryptedTallies.push(await contract.getEncryptedTally(i));
    }

    const decOption0 = await fhevm.userDecryptEuint(FhevmType.euint32, encryptedTallies[0], address, signers.deployer);
    const decOption1 = await fhevm.userDecryptEuint(FhevmType.euint32, encryptedTallies[1], address, signers.deployer);

    expect(decOption0).to.eq(1);
    expect(decOption1).to.eq(2);
    expect(await contract.voterCount()).to.eq(3n);
  });

  it("prevents duplicate voting from the same address", async function () {
    const encVote = await fhevm.createEncryptedInput(address, signers.alice.address).add32(2).encrypt();

    await (await contract.connect(signers.alice).submitEncryptedVote(encVote.handles[0], encVote.inputProof)).wait();

    await expect(
      contract.connect(signers.alice).submitEncryptedVote(encVote.handles[0], encVote.inputProof),
    ).to.be.revertedWithCustomError(contract, "AlreadyVoted");
  });

  it("opens a decryption request after the voting window ends", async function () {
    const encVote = await fhevm.createEncryptedInput(address, signers.alice.address).add32(0).encrypt();
    await (await contract.connect(signers.alice).submitEncryptedVote(encVote.handles[0], encVote.inputProof)).wait();

    await ethers.provider.send("evm_increaseTime", [Number(VOTING_DURATION_SECONDS) + 5]);
    await ethers.provider.send("evm_mine", []);

    const tx = await contract.requestEncryptedTallyDecryption();
    const receipt = await tx.wait();
    expect(receipt?.status).to.eq(1);
    expect(await contract.decryptionPending()).to.eq(true);
    expect(await contract.finalized()).to.eq(false);
  });
});
