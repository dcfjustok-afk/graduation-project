import { createLogAgent } from "./agent/logAgent";

async function bootstrap() {
  const agent = createLogAgent();
  await agent.start();
}

bootstrap().catch((error) => {
  console.error("[agent] 启动失败", error);
  process.exit(1);
});