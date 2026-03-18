import hre from "hardhat";
import fs from "node:fs";
import path from "node:path";

function syncServerEnv(contractAddress: string) {
  const envPath = path.resolve(__dirname, "../../../apps/server/.env");
  const nextLine = `LOG_REGISTRY_ADDRESS=${contractAddress}`;

  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, `${nextLine}\n`, "utf8");
    console.log("Synced LOG_REGISTRY_ADDRESS to apps/server/.env");
    return;
  }

  const current = fs.readFileSync(envPath, "utf8");
  const updated = current.match(/^LOG_REGISTRY_ADDRESS=.*$/m)
    ? current.replace(/^LOG_REGISTRY_ADDRESS=.*$/m, nextLine)
    : `${current.trimEnd()}\n${nextLine}\n`;

  fs.writeFileSync(envPath, updated, "utf8");
  console.log("Synced LOG_REGISTRY_ADDRESS to apps/server/.env");
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