import { Contract, JsonRpcProvider, Wallet } from "ethers";
import { env } from "../config/env";
import { logRegistryAbi } from "./logRegistryAbi";

function assertBlockchainConfig() {
  if (!env.logRegistryAddress) {
    throw new Error("未配置 LOG_REGISTRY_ADDRESS，无法执行链上写入");
  }

  if (!env.blockchainPrivateKey) {
    throw new Error("未配置 BLOCKCHAIN_PRIVATE_KEY，无法执行链上写入");
  }
}

export function createLogRegistryClient() {
  assertBlockchainConfig();

  const provider = new JsonRpcProvider(env.hardhatRpcUrl);
  const wallet = new Wallet(env.blockchainPrivateKey, provider);
  const contract = new Contract(env.logRegistryAddress, logRegistryAbi, wallet);

  return {
    provider,
    wallet,
    contract,
  };
}