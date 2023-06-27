import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";
import { Contract } from "ethers";

import { lotteryAbi } from "../utils/abis/abis";

import { initDb } from "../utils/db.js";

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, secrets, multiChainProvider } = context;

  const provider = multiChainProvider.default();

  // User Secrets
  const PRIVATE_KEY = (await secrets.get("PRIVATE_KEY_POLYBASE")) as string;
  const PUBLIC_KEY = (await secrets.get("PUBLIC_KEY_POLYBASE")) as string;

  const lotteryAddress = userArgs.lotteryAddress as string;
  if (!lotteryAddress) throw new Error("Missing userArgs.lotteryAddress");

  const lottery = new Contract(lotteryAddress as string, lotteryAbi, provider);
  const db = await initDb(PRIVATE_KEY, PUBLIC_KEY);

  const coll = db.collection("Participants");

  let res = await coll.get();

  if (res.data.length == 0) {
    return { canExec: false, message: `There are no participants yet` };
  }

  const winnerIndex = Math.floor(Math.random() * res.data.length);
  const winner = res.data[winnerIndex].data.name;

  console.log(`Winner is ${winner}`);
  return {
    canExec: true,
    callData: [
      {
        to: lotteryAddress,
        data: lottery.interface.encodeFunctionData("updateWinner", [winner]),
      },
    ],
  };
});
