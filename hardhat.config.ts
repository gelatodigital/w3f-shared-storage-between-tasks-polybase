import { HardhatUserConfig } from "hardhat/config";

// PLUGINS
import "@gelatonetwork/web3-functions-sdk/hardhat-plugin";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";
import "hardhat-deploy";

// Process Env Variables
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/.env" });

const PK = process.env.PK;
const ALCHEMY_ID = process.env.ALCHEMY_ID;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

// HardhatUserConfig bug
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config: HardhatUserConfig = {
  // web3 functions
  w3f: {
    rootDir: "./web3-functions",
    debug: false,
    networks: ["hardhat", "mumbai"], //(multiChainProvider) injects provider for these networks
  },
  // hardhat-deploy
  namedAccounts: {
    deployer: {
      default: 0,
    },
    dedicatedMsgSender: {
      hardhat: "0xbb97656cd5fece3a643335d03c8919d5e7dcd225",
      polygon: "0xbb97656cd5fece3a643335d03c8919d5e7dcd225",
      mumbai: "0xcc53666e25bf52c7c5bc1e8f6e1f6bf58e871659",
    },
  },
  defaultNetwork: "hardhat",

  networks: {
    hardhat: {
      forking: {
        url: `https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_ID}`,
        blockNumber: 37125380,
      },
    },

    ethereum: {
      accounts: PK ? [PK] : [],
      chainId: 1,
      url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_ID}`,
    },
    mumbai: {
      accounts: PK ? [PK] : [],
      chainId: 80001,
      url: `https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_ID}`,
    },
    polygon: {
      accounts: PK ? [PK] : [],
      chainId: 137,
      url: "https://polygon-rpc.com",
    },
  },

  solidity: {
    compilers: [
      {
        version: "0.8.18",
        settings: {
          optimizer: { enabled: true, runs: 200 },
        },
      },
    ],
  },

  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },

  // hardhat-deploy
  verify: {
    etherscan: {
      apiKey: ETHERSCAN_API_KEY ? ETHERSCAN_API_KEY : "",
    },
  },
};

export default config;
