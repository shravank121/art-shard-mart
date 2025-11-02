const { ethers } = require("ethers");

// Calculate error selector
const errorSig = "OwnableUnauthorizedAccount(address)";
const selector = ethers.id(errorSig).slice(0, 10);

console.log("\n========================================");
console.log("Error Signature:", errorSig);
console.log("Calculated Selector:", selector);
console.log("Your Error Selector: 0x118cdaa7");
console.log("Match:", selector === "0x118cdaa7" ? "✅ YES" : "❌ NO");
console.log("========================================\n");

// Decode the error data
const errorData = "0x118cdaa7000000000000000000000000b23700417951616aa99c6ff4ce4740f7542829b6";
const iface = new ethers.Interface([
  "error OwnableUnauthorizedAccount(address account)"
]);

try {
  const decoded = iface.parseError(errorData);
  console.log("Decoded Error:");
  console.log("  Name:", decoded.name);
  console.log("  Account:", decoded.args[0]);
  console.log("\n🔍 Meaning: The address", decoded.args[0], "is not the owner of the contract");
} catch (e) {
  console.log("Could not decode:", e.message);
}
