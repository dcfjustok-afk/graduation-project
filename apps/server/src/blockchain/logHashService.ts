import crypto from "node:crypto";

export function calculateLogHash(logContent: string) {
  return `0x${crypto.createHash("sha256").update(logContent, "utf8").digest("hex")}`;
}