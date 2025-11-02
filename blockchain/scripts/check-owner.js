const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const contractAddress = "0x941b12780a04968844668332c915aC2F246E0c7B";
  const abi = ["function owner() view returns (address)"];
  const contract = new ethers.Contract(contractAddress, abi, provider);
  
  const owner = await contract.owner();
  
  console.log("\n========================================");
  console.log("Contract Address:", contractAddress);
  console.log("Contract Owner:", owner);
  console.log("Backend Wallet:", wallet.address);
  console.log("Match:", owner.toLowerCase() === wallet.address.toLowerCase() ? "✅ YES" : "❌ NO");
  console.log("========================================\n");
  
  if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
    console.log("⚠️  PROBLEM: Backend wallet is NOT the contract owner!");
    console.log("Solution: Use the private key of:", owner);
  }
}

main().catch(console.error);
