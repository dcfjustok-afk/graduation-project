import fs from "fs";
import path from "path";

export function ensureParentDirectory(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

export function ensureFileExists(filePath: string) {
  ensureParentDirectory(filePath);

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "", "utf8");
  }
}