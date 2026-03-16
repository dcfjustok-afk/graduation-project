import fs from "fs";

export interface IncrementalReadResult {
  newOffset: number;
  lines: string[];
}

/**
 * 从上次偏移量开始，仅读取日志文件新增的内容。
 */
export function readIncrementalLines(filePath: string, lastOffset: number): IncrementalReadResult {
  const stat = fs.statSync(filePath);

  if (stat.size < lastOffset) {
    return {
      newOffset: stat.size,
      lines: [],
    };
  }

  if (stat.size === lastOffset) {
    return {
      newOffset: lastOffset,
      lines: [],
    };
  }

  const fd = fs.openSync(filePath, "r");

  try {
    const size = stat.size - lastOffset;
    const buffer = Buffer.alloc(size);
    fs.readSync(fd, buffer, 0, size, lastOffset);
    const content = buffer.toString("utf8");

    return {
      newOffset: stat.size,
      lines: content
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean),
    };
  } finally {
    fs.closeSync(fd);
  }
}