const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const feeRecipient = process.env.FEE_RECIPIENT || deployer.address;

  const Marketplace = await hre.ethers.getContractFactory("ArtShardMarketplace");
  const marketplace = await Marketplace.deploy(feeRecipient);
  await marketplace.waitForDeployment();

  const addr = await marketplace.getAddress();
  console.log("ArtShardMarketplace deployed at:", addr);

  // Save a simple deployments file
  const fs = require("fs");
  const path = require("path");
  const outDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  const outFile = path.join(outDir, "marketplace-sepolia.json");
  fs.writeFileSync(
    outFile,
    JSON.stringify(
      {
        network: hre.network.name,
        address: addr,
        feeRecipient,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    )
  );
  console.log("Saved:", outFile);
  console.log("Etherscan (Sepolia): https://sepolia.etherscan.io/address/" + addr);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
