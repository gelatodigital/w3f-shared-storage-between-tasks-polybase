/* eslint-disable @typescript-eslint/naming-convention */
import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";
import { Contract } from "ethers";

import { lotteryAbi } from "../utils/abis/abis";

import { initDb } from "../utils/db.js";

const MAX_RANGE = 100;

interface record {
  name: string;
  participant: string;
}

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, storage, secrets, multiChainProvider } = context;

  const provider = multiChainProvider.default();

  // User Secrets
  const PRIVATE_KEY = (await secrets.get("PRIVATE_KEY_POLYBASE")) as string;
  const PUBLIC_KEY = (await secrets.get("PUBLIC_KEY_POLYBASE")) as string;

  const lotteryAddress = userArgs.lotteryAddress;
  if (!lotteryAddress) throw new Error("Missing userArgs.lotteryAddress");

  const lottery = new Contract(lotteryAddress as string, lotteryAbi, provider);

  const currentBlock = await provider.getBlockNumber();
  const lastBlockStr = await storage.get("lastBlockNumber");
  let lastBlock: number = +(lastBlockStr
    ? parseInt(lastBlockStr)
    : (userArgs.genesisBlock as number));
  console.log(`Last processed block: ${lastBlock}, ${lastBlock}`);

  // Retrieve new mint event
  let nbRequests = 0;
  const topics = [lottery.interface.getEventTopic("AddParticipant")];
  // Fetch historical events in batch without exceeding runtime limits
  const newParticipants: Array<record> = [];
  while (lastBlock < currentBlock) {
    nbRequests++;
    const fromBlock = lastBlock;
    const toBlock = Math.min(fromBlock + MAX_RANGE, currentBlock);
    try {
      console.log(`Fetching log events from blocks ${fromBlock} to ${toBlock}`);
      const eventFilter = {
        address: lottery.address,
        topics,
        fromBlock,
        toBlock,
      };

      const transferLogs = await provider.getLogs(eventFilter);

      for (const transferLog of transferLogs) {
        const transferEvent = lottery.interface.parseLog(transferLog);
        const [participant, name] = transferEvent.args;
        newParticipants.push({ name, participant });
      }
      lastBlock = toBlock;
    } catch (err) {
      return {
        canExec: false,
        message: `Rpc call failed: ${(err as Error).message}`,
      };
    }
  }

  await storage.set("lastBlockNumber", lastBlock.toString());

  if (newParticipants?.length == 0) {
    return {
      canExec: false,
      message: "No new participants",
    };
  }

  const db = await initDb(PRIVATE_KEY, PUBLIC_KEY);
  const coll = db.collection("Participants");

  for (const participant of newParticipants) {
    const record = await coll.record(participant.participant).get();

    if (record.exists()) {
      await record.call("updateName", [participant.name]);
    } else {
      await coll.create([participant.participant, participant.name]);
    }
  }

  return {
    canExec: false,
    message: `${newParticipants?.length} participants were added/updated`,
  };
});
