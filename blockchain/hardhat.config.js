require('dotenv').config();
require('@nomicfoundation/hardhat-toolbox');

const RPC_URL = process.env.RPC_URL || '';
const PRIVATE_KEY = process.env.PRIVATE_KEY || '';

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    hardhat: {},
    sepolia: {
      url: RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    }
  }
};
