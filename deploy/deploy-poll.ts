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

  // Set voting period: starts now, ends in 7 days
  const startTime = Math.floor(Date.now() / 1000);
  const endTime = startTime + (7 * 24 * 60 * 60); // 7 days

  const deployedPoll = await deploy("EncryptedPredictionPoll", {
    from: deployer,
    args: [
      pollName,
      pollHeadline,
      pollDescription,
      optionLabels,
      optionDescriptions,
      startTime,
      endTime
    ],
    log: true,
    waitConfirmations: 1,
  });

  console.log(`\n✅ EncryptedPredictionPoll deployed at: ${deployedPoll.address}`);
  console.log(`📊 Poll: "${pollHeadline}"`);
  console.log(`⏰ Voting period: ${new Date(startTime * 1000).toISOString()} to ${new Date(endTime * 1000).toISOString()}`);
  console.log(`📝 Options: ${optionLabels.length}`);
  console.log(`\n🔗 Add this to your frontend:\nContract Address: ${deployedPoll.address}`);
};

export default func;
func.id = "deploy_encryptedPredictionPoll";
func.tags = ["EncryptedPredictionPoll", "poll"];

