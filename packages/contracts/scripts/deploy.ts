import hre from "hardhat";
import fs from "node:fs";
import path from "node:path";

const localhostDeployerPrivateKey =
  process.env.LOCALHOST_DEPLOYER_PRIVATE_KEY ||
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

function syncServerEnv(contractAddress: string) {
  const envPath = path.resolve(__dirname, "../../../apps/server/.env");
  const nextLines = [
    `PORT=3010`,
    `LOG_REGISTRY_ADDRESS=${contractAddress}`,
    `BLOCKCHAIN_PRIVATE_KEY=${localhostDeployerPrivateKey}`,
  ];

  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, `${nextLines.join("\n")}\n`, "utf8");
    console.log("Synced localhost blockchain config to apps/server/.env");
    return;
  }

  const current = fs.readFileSync(envPath, "utf8");
  let updated = current;

  for (const nextLine of nextLines) {
    const key = nextLine.split("=", 1)[0];
    const pattern = new RegExp(`^${key}=.*$`, "m");
    updated = updated.match(pattern)
      ? updated.replace(pattern, nextLine)
      : `${updated.trimEnd()}\n${nextLine}\n`;
  }

  fs.writeFileSync(envPath, updated, "utf8");
  console.log("Synced localhost blockchain config to apps/server/.env");
}

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();

  console.log("Deploying LogRegistry with account:", deployer.address);

  const logRegistryFactory = await ethers.getContractFactory("LogRegistry");
  const logRegistry = await logRegistryFactory.deploy(deployer.address, deployer.address);
  await logRegistry.waitForDeployment();
  const contractAddress = await logRegistry.getAddress();

  if (hre.network.name === "localhost") {
    syncServerEnv(contractAddress);
  }

  console.log("LogRegistry deployed to:", contractAddress);
  console.log("Admin account:", deployer.address);
  console.log("Initial logger account:", deployer.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});