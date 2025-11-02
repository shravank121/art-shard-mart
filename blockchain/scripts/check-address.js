const { ethers } = require("ethers");

const privateKey = "0xf36744293d99c41306c3d1adb731d8b06577559fe34e59ab15d433fd33e26b44";
const wallet = new ethers.Wallet(privateKey);

console.log("\n========================================");
console.log("Private Key:", privateKey);
console.log("Derives to Address:", wallet.address);
console.log("========================================\n");
