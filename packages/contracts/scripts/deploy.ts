import hre from "hardhat";

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();

  console.log("Deploying LogRegistry with account:", deployer.address);

  const logRegistryFactory = await ethers.getContractFactory("LogRegistry");
  const logRegistry = await logRegistryFactory.deploy(deployer.address);
  await logRegistry.waitForDeployment();

  console.log("LogRegistry deployed to:", await logRegistry.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});