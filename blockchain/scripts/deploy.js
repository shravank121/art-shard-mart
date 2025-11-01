const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const Factory = await hre.ethers.getContractFactory("ArtShardNFT");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("ArtShardNFT deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
