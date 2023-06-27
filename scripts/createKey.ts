import { secp256k1, encodeToString } from "@polybase/util";

async function createPk() {
  const privateKey = await secp256k1.generatePrivateKey();
  const publicKey = await secp256k1.getPublicKey(privateKey);
  console.log(`
    Add these keys to your env variables:
      PUBLIC_KEY=${encodeToString(publicKey, "hex")}
      PRIVATE_KEY=${encodeToString(privateKey, "hex")}
  `);
}

createPk();
