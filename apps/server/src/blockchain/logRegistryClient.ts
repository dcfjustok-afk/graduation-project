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

export async function ensureLogRegistryContractAvailable(
  provider: JsonRpcProvider,
  contractAddress = env.logRegistryAddress,
) {
  const code = await provider.getCode(contractAddress);

  if (!code || code === "0x") {
    throw new Error(
      `目标地址未检测到 LogRegistry 合约代码，请先部署本地合约。rpc=${env.hardhatRpcUrl}, address=${contractAddress}`,
    );
  }
}

export function createLogRegistryReadClient(contractAddress = env.logRegistryAddress) {
  if (!contractAddress) {
    throw new Error("未配置 LOG_REGISTRY_ADDRESS，无法执行链上查询");
  }

  const provider = new JsonRpcProvider(env.hardhatRpcUrl);
  const contract = new Contract(contractAddress, logRegistryAbi, provider);

  return {
    provider,
    contract,
  };
}