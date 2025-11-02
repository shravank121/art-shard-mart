const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const address = deployer.address;
  const balance = await hre.ethers.provider.getBalance(address);
  const balanceInEth = hre.ethers.formatEther(balance);

  console.log("\n========================================");
  console.log("Wallet Address:", address);
  console.log("Balance:", balanceInEth, "ETH");
  console.log("Network:", hre.network.name);
  console.log("========================================\n");

  if (balance === 0n) {
    console.log("⚠️  WARNING: Balance is 0!");
    console.log("Get Sepolia ETH from: https://sepoliafaucet.com/");
    console.log(`Send to: ${address}\n`);
    process.exit(1);
  } else {
    console.log("✅ Wallet has sufficient balance for deployment\n");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
