import { createLogRegistryClient, ensureLogRegistryContractAvailable } from "../blockchain/logRegistryClient";
import { calculateLogHash } from "../blockchain/logHashService";
import { env } from "../config/env";
import { createLog, CreateLogPayload, createLogHashRecord } from "../repositories/logRepository";

export async function persistLogAndWriteChain(payload: CreateLogPayload) {
  const createdLog = await createLog(payload);
  const logHash = calculateLogHash(payload.logContent);

  try {
    const { provider, contract } = createLogRegistryClient();
    await ensureLogRegistryContractAvailable(provider);
    const tx = await contract.storeLog(payload.taskId, logHash);
    const receipt = await tx.wait();

    const hashRecord = await createLogHashRecord({
      logId: createdLog.id,
      taskId: payload.taskId,
      logHash,
      chainName: "hardhat",
      contractAddress: env.logRegistryAddress,
      transactionHash: tx.hash,
      blockNumber: receipt?.blockNumber ?? null,
      onChainStatus: receipt?.status === 1 ? "confirmed" : "failed",
    });

    return {
      log: createdLog,
      hashRecord,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown blockchain error";

    const hashRecord = await createLogHashRecord({
      logId: createdLog.id,
      taskId: payload.taskId,
      logHash,
      chainName: "hardhat",
      contractAddress: env.logRegistryAddress || null,
      transactionHash: null,
      blockNumber: null,
      onChainStatus: `failed:${message}`,
    });

    return {
      log: createdLog,
      hashRecord,
      error: message,
    };
  }
}