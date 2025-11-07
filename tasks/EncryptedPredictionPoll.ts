import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

const CONTRACT_NAME = "EncryptedPredictionPoll";

task("poll:address", "Prints the EncryptedPredictionPoll deployment address").setAction(
  async (_args: TaskArguments, hre) => {
    const { deployments } = hre;
    const deployment = await deployments.get(CONTRACT_NAME);
    console.log(`${CONTRACT_NAME} address: ${deployment.address}`);
  },
);

task("poll:info", "Displays poll metadata, options, and encrypted tallies")
  .addOptionalParam("address", "Optionally override the deployed poll address")
  .setAction(async (args: TaskArguments, hre) => {
    const { ethers, deployments } = hre;

    const deployment = args.address ? { address: args.address } : await deployments.get(CONTRACT_NAME);
    const poll = await ethers.getContractAt(CONTRACT_NAME, deployment.address);

    const [name, headline, description, startTime, endTime, optionCount, voterCount, finalized, decryptionPending] =
      await Promise.all([
        poll.pollName(),
        poll.pollHeadline(),
        poll.pollDescription(),
        poll.startTime(),
        poll.endTime(),
        poll.optionCount(),
        poll.voterCount(),
        poll.finalized(),
        poll.decryptionPending(),
      ]);

    console.log(`\n=== ${headline} (${name}) ===`);
    console.log(description);
    console.log(
      `Voting window : ${new Date(Number(startTime) * 1000).toISOString()} -> ${new Date(
        Number(endTime) * 1000,
      ).toISOString()}`,
    );
    console.log(`Voters        : ${voterCount.toString()}`);
    console.log(`Finalized     : ${finalized ? "yes" : "no"}`);
    console.log(`DecryptionPending : ${decryptionPending ? "yes" : "no"}`);
    console.log("\nOptions:");

    const totalOptions = Number(optionCount);
    for (let i = 0; i < totalOptions; i++) {
      const { label, description: optionDescription } = await poll.getOption(i);
      const encryptedTally = await poll.getEncryptedTally(i);
      console.log(`  [${i}] ${label} — ${optionDescription}`);
      console.log(`      encrypted tally handle: ${encryptedTally}`);
    }
  });

task("poll:vote", "Submits an encrypted vote for a given option index")
  .addParam("option", "Zero-based option index to vote for")
  .addOptionalParam("address", "Optionally override the deployed poll address")
  .setAction(async (args: TaskArguments, hre) => {
    const { ethers, deployments, fhevm } = hre;

    const optionIndex = parseInt(args.option, 10);
    if (!Number.isInteger(optionIndex) || optionIndex < 0) {
      throw new Error("--option must be a non-negative integer index");
    }

    const deployment = args.address ? { address: args.address } : await deployments.get(CONTRACT_NAME);
    const poll = await ethers.getContractAt(CONTRACT_NAME, deployment.address);
    const optionCount = Number(await poll.optionCount());

    if (optionIndex >= optionCount) {
      throw new Error(`Option index out of bounds. Available options: 0..${optionCount - 1}`);
    }

    await fhevm.initializeCLIApi();

    const [signer] = await ethers.getSigners();
    const encryptedVote = await fhevm
      .createEncryptedInput(deployment.address, signer.address)
      .add32(optionIndex)
      .encrypt();

    const tx = await poll.connect(signer).submitEncryptedVote(encryptedVote.handles[0], encryptedVote.inputProof);

    console.log(`Submitted encrypted vote tx: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Status: ${receipt?.status}`);
  });

task("poll:decrypt", "Requests oracle decryption once voting has closed")
  .addOptionalParam("address", "Optionally override the deployed poll address")
  .setAction(async (args: TaskArguments, hre) => {
    const { ethers, deployments } = hre;

    const deployment = args.address ? { address: args.address } : await deployments.get(CONTRACT_NAME);
    const poll = await ethers.getContractAt(CONTRACT_NAME, deployment.address);

    const tx = await poll.requestEncryptedTallyDecryption();
    console.log(`Requested tally decryption tx: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Status: ${receipt?.status}`);
  });

task("poll:clear-results", "Reads cleartext tallies after oracle finalization")
  .addOptionalParam("address", "Optionally override the deployed poll address")
  .setAction(async (args: TaskArguments, hre) => {
    const { ethers, deployments } = hre;

    const deployment = args.address ? { address: args.address } : await deployments.get(CONTRACT_NAME);
    const poll = await ethers.getContractAt(CONTRACT_NAME, deployment.address);
    const optionCount = Number(await poll.optionCount());

    const tallies: Array<{ label: string; tally: string }> = [];
    for (let i = 0; i < optionCount; i++) {
      const { label } = await poll.getOption(i);
      const tally = await poll.getClearTally(i);
      tallies.push({ label, tally: tally.toString() });
    }

    console.log("\nFinalized tallies:");
    for (const { label, tally } of tallies) {
      console.log(`  ${label}: ${tally}`);
    }
  });

task("poll:user-decrypt", "Decrypts encrypted tallies locally using CLI utilities")
  .addOptionalParam("address", "Optionally override the deployed poll address")
  .setAction(async (args: TaskArguments, hre) => {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const deployment = args.address ? { address: args.address } : await deployments.get(CONTRACT_NAME);
    const poll = await ethers.getContractAt(CONTRACT_NAME, deployment.address);
    const optionCount = Number(await poll.optionCount());
    const [signer] = await ethers.getSigners();

    console.log(`Decrypting tallies for ${CONTRACT_NAME} at ${deployment.address}`);

    for (let i = 0; i < optionCount; i++) {
      const { label } = await poll.getOption(i);
      const encryptedTally = await poll.getEncryptedTally(i);

      if (encryptedTally === ethers.ZeroHash) {
        console.log(`  ${label}: encrypted handle not initialized yet`);
        continue;
      }

      const tally = await fhevm.userDecryptEuint(FhevmType.euint32, encryptedTally, deployment.address, signer);
      console.log(`  ${label}: clear tally = ${tally.toString()}`);
    }
  });
