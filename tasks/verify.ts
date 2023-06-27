import { task } from "hardhat/config";

export const verify = task("etherscan-verify", "verify").setAction(
  async ({}, hre) => {
    await hre.run("verify:verify", {
      address: "0xC07D82801966EfF476DE04697c9DC79252dB59f5",
      constructorArguments: ["0xcc53666e25bf52c7c5bc1e8f6e1f6bf58e871659"],
    });
  }
);
