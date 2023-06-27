# Gelato Web3 Functions <<-->> Shared storage between tasks using Polybase

## Summary

This project showcases the possibiity to share storage (state) between two Web3 Functions tasks.
We will use Polybase as shared storage.

We will need:

**Lottery Contract**:
A very simple lottery contract with three methods:

- addName(): Where users can request to take part. This method will emit the AddParticipant event with the user address and name
- updateWinner(): only called by the Web3Function that updates the winner
- getLastWinner(): returns current winner

**Polybase db**:
A simple polybase database with the collection `Participants`

**Gelato Web3 Functions**:
We will create two Web3 Functions tasks:

- readlogs: will fetch the 'AddParticipant' events and update the Polybase db if needed
- lottery: will query the Participants collection from the Polybase db every minute, randomly pick a winner, and update the Lottery contract

## Demo

- Mumbai:

  - Smart Contract: [https://mumbai.polygonscan.com/address/0xc07d82801966eff476de04697c9dc79252db59f5](https://mumbai.polygonscan.com/address/0xb26a01df1913a9f1e9cdbaed240e8a38f724a673#readContract)

  - Web3 Function ReadLogs: [https://beta.app.gelato.network/task/0xfe7858455306a649492d2ceaf7c2453d597158212dab4a5d2568c2f4aef6c6c7?chainId=80001](https://beta.app.gelato.network/task/0xfe7858455306a649492d2ceaf7c2453d597158212dab4a5d2568c2f4aef6c6c7?chainId=80001)

  - Web3 Function Lottery: [https://beta.app.gelato.network/task/0xf2870e5b875705b12158bc09ca04c11d3a2435f118e3e4920a5bd43634d03956?chainId=80001](https://beta.app.gelato.network/task/https://beta.app.gelato.network/task/0xf2870e5b875705b12158bc09ca04c11d3a2435f118e3e4920a5bd43634d03956?chainId=80001)

## Deploy your smart contract

```
yarn run deploy
```

## Create the Polybase

Please run the following script to generate public/private key pair associated to your polybase database.

```
 npx hardhat run scripts/createKey.ts
```

This script will console log the public and private key generated. please copy them into the .env file at the root folder:

```
PRIVATE_KEY_POLYBASE=
PUBLIC_KEY_POLYBASE=
```

Now let's create the db with the Participant collection.

```
 npx hardhat run scripts/createDb.ts
```

Collection Def:

```
@public
  collection Participants {
    id: string;
    name: string;
    constructor (id: string, name: string) {
      this.id = id;
      this.name = name;
    }
    updateName(name: string) {
      this.name = name;
    }
    del () {
      selfdestruct();
    }
  }
```

And we are all set with our Polybase db!!

### Known Issues

At the time of writing the `@polybase/client` is in version "0.6.2",
There is a bug in the creation of the public key, If this is the case, please delete the first two bytes (first two characters after "0x") from the public key before copying it to the env file.

&nbsp;

## Web3 Functions

### Reading Logs

Please copy the Private and Public keys in the .env at the web3 Function level

The readlogs web3 function will, every minute, read the `AddParticipant() events since the last block processed

```
  const topics = [lottery.interface.getEventTopic("AddParticipant")];
  const eventFilter = {
        address: lottery.address,
        topics,
        fromBlock,
        toBlock,
      };
```

and in the case that new Participants are found, we will update the Polybase db

```
  const db = await initDb(PRIVATE_KEY, PUBLIC_KEY);

  const coll = db.collection("Participants");

  for (const participant of newParticipants) {
    const record = await coll.record(participant.participant).get();

    if (record.exists()){

     await record.call("updateName",[participant.name])

    } else {
      await coll.create([participant.participant,participant.name]);
    }

  }
```

### Lottery

This Web3 Function queries the participants from the Polybase DB, randomly selects one winner and publishes the transaction online to update the winner

Please copy the Private and Public keys in the .env at the web3 Function level

```
const db = await initDb(PRIVATE_KEY, PUBLIC_KEY);

const coll = db.collection("Participants");

let res = await coll.get();
  ...
return {
    canExec: true,
    callData: [
      {
        to: lotteryAddress,
        data: lottery.interface.encodeFunctionData("updateWinner", [winner]),
      },
    ],
  };
```

## How to run

1. Install project dependencies:

```
yarn install
```

2. Create a `.env` file with your private config at root level and at each web3 function level:

```
cp .env.example .env
```

You will need to input your `PROVIDER_URLS`, your RPC.

3. Test the web3 function

```
npx w3f test web3-functions/lottery/index.ts --logs --chain-id=80001

npx w3f test web3-functions/readLogs/index.ts --logs --chain-id=80001
```

E2E Hardhat tests

```
yarn test
```

4. Deploy the web3 function on IPFS

```
npx w3f deploy web3-functions/lottery/index.ts

npx w3f deploy web3-functions/readLogs/index.ts
```

✓ Web3Function deployed to ipfs.
✓ CID: QmWz7Y4fpoTxrXsHe1MK9qnk9bNUZrapMGGYiiEcm995JE

5. Create the task following the link provided when deploying the web3 to IPFS in our case:

```
https://beta.app.gelato.network/new-task?cid=QmWz7Y4fpoTxrXsHe1MK9qnk9bNUZrapMGGYiiEcm995JE
```
