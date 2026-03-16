const fs = require("fs");
const path = require("path");

const logFile = path.resolve(__dirname, "..", "logs", "demo-agent.log");
fs.mkdirSync(path.dirname(logFile), { recursive: true });

const line = `[${new Date().toISOString()}] demo log ${Math.random().toString(16).slice(2)}\n`;
fs.appendFileSync(logFile, line, "utf8");

console.log(`[agent-demo] appended: ${line.trim()}`);