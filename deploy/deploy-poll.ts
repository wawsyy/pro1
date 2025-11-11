import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying EncryptedPredictionPoll contract...");
  console.log("Deployer address:", deployer);
  console.log("Network:", hre.network.name);

  // Define poll parameters
  const pollName = "FHEVM Demo Poll";
  const pollHeadline = "Which technology will dominate in 2025?";
  const pollDescription = "Cast your encrypted vote for the technology trend you believe will be most impactful.";
  
  const optionLabels = [
    "AI & Machine Learning",
    "Blockchain & Web3",
    "Quantum Computing",
    "Renewable Energy Tech"
  ];
  
  const optionDescriptions = [
    "Artificial Intelligence and Machine Learning advances",
    "Decentralized technologies and Web3 applications",
    "Quantum computing breakthroughs",
    "Innovations in renewable energy"
  ];

  // Set voting duration: 7 days
  const votingDurationSeconds = 7 * 24 * 60 * 60; // 7 days in seconds

  const deployedPoll = await deploy("EncryptedPredictionPoll", {
    from: deployer,
    args: [
      pollName,
      pollHeadline,
      pollDescription,
      optionLabels,
      optionDescriptions,
      votingDurationSeconds
    ],
    log: true,
    waitConfirmations: 1,
  });

  console.log(`\n✅ EncryptedPredictionPoll deployed at: ${deployedPoll.address}`);
  console.log(`📊 Poll: "${pollHeadline}"`);
  console.log(`⏰ Voting duration: ${votingDurationSeconds / 86400} days`);
  console.log(`📝 Options: ${optionLabels.length}`);
  console.log(`\n🔗 Contract Address: ${deployedPoll.address}`);
};

export default func;
func.id = "deploy_encryptedPredictionPoll";
func.tags = ["EncryptedPredictionPoll", "poll"];

