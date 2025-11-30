const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Fee recipient is the deployer
  const feeRecipient = deployer.address;

  const Factory = await hre.ethers.getContractFactory("FractionMarketplace");
  const contract = await Factory.deploy(feeRecipient);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const network = hre.network.name;
  
  console.log("\n========================================");
  console.log("✅ FractionMarketplace deployed to:", address);
  console.log("🌐 Network:", network);
  console.log("💰 Fee Recipient:", feeRecipient);
  console.log("========================================\n");

  // Save deployment info
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const filename = path.join(deploymentsDir, `${network}-fraction-marketplace.json`);
  fs.writeFileSync(filename, JSON.stringify({
    network,
    contractAddress: address,
    feeRecipient,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  }, null, 2));
  
  console.log(`📝 Deployment info saved to: ${filename}`);
  console.log(`\n📋 Add to Frontend/.env:`);
  console.log(`VITE_SEPOLIA_FRACTION_MARKETPLACE_ADDRESS=${address}`);

  if (network === "sepolia") {
    console.log(`\n🔍 View on Sepolia Etherscan:`);
    console.log(`   https://sepolia.etherscan.io/address/${address}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
