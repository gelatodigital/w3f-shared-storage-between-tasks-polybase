import hre, { deployments, ethers, w3f } from "hardhat";

import { expect } from "chai";
import { Lottery } from "../typechain";
import { before } from "mocha";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  impersonateAccount,
  setBalance,
  time,
} from "@nomicfoundation/hardhat-network-helpers";
import {
  Web3FunctionResultCallData,
  Web3FunctionResultV2,
  Web3FunctionUserArgs,
} from "@gelatonetwork/web3-functions-sdk";
import { Web3FunctionHardhat } from "@gelatonetwork/web3-functions-sdk/hardhat-plugin";
import { parseEther } from "ethers/lib/utils";

import { initDb } from "../web3-functions/utils/db";

const PRIVATE_KEY_POLYBASE = process.env.PRIVATE_KEY_POLYBASE as string;
const PUBLIC_KEY_POLYBASE = process.env.PUBLIC_KEY_POLYBASE as string;

describe("Lottery Tests", function () {
  this.timeout(0);

  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  let lottery: Lottery;
  let lotteryAddress: string;
  let readLogsW3f: Web3FunctionHardhat;
  let lotteryW3f: Web3FunctionHardhat;
  let userArgs: Web3FunctionUserArgs;

  let dedicatedMsgSenderAddress: string;

  before(async function () {
    const genesisBlock = await hre.ethers.provider.getBlockNumber();

    await deployments.fixture();

    [owner, user1, user2] = await hre.ethers.getSigners();
    lotteryAddress = (await deployments.get("Lottery")).address;
    lottery = (await ethers.getContractAt(
      "Lottery",
      lotteryAddress
    )) as Lottery;
    readLogsW3f = w3f.get("readLogs");
    lotteryW3f = w3f.get("lottery");

    userArgs = {
      genesisBlock: genesisBlock.toString(),
      lotteryAddress: lotteryAddress,
    };

    const {
      lensHub: lensHubAddress,
      dedicatedMsgSender: dedicatedMsgSender,
      collectModule: collectModule,
    } = await hre.getNamedAccounts();

    dedicatedMsgSenderAddress = dedicatedMsgSender;
  });

  it("Emit AddParticipant event", async () => {
    await expect(lottery.connect(user1).addName("test0")).to.emit(
      lottery,
      "AddParticipant(address,string)"
    );

    let { result } = await readLogsW3f.run({ userArgs });
    result = result as Web3FunctionResultV2;

    await expect(lottery.connect(user1).addName("test5"))
      .to.emit(lottery, "AddParticipant(address,string)")
      .withArgs(user1.address, "test5");

    await expect(lottery.connect(user2).addName("test5")).to.emit(
      lottery,
      "AddParticipant(address,string)"
    );
  });

  it("It update properly polybase db", async () => {
    const db = await initDb(PRIVATE_KEY_POLYBASE, PUBLIC_KEY_POLYBASE);

    const coll = db.collection("Participants");

    let tx = await lottery.connect(user1).addName("testNew");
    await tx.wait();

    const w3fReadLofsResult = await readLogsW3f.run({ userArgs });

    const record = coll.record(user1.address);
    const name = (await record.get()).data.name;

    expect(name).to.be.eq("testNew");
  });

  it("It executes update transaction winner properly", async () => {
    const l3fResult = await lotteryW3f.run({ userArgs });

    if (l3fResult.result.canExec == true) {
      await impersonateAccount(dedicatedMsgSenderAddress);
      const dedicatedMsgSenderSigner = await ethers.getSigner(
        dedicatedMsgSenderAddress
      );
      await setBalance(dedicatedMsgSenderAddress, parseEther("10"));

      const data = l3fResult.result.callData[0] as Web3FunctionResultCallData;

      let winner = await lottery.getLastWinner();

      console.log(winner);

      await dedicatedMsgSenderSigner.sendTransaction({
        to: data.to,
        data: data.data,
      });
      winner = await lottery.getLastWinner();
    }
  });
});
