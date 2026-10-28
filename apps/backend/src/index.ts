import { startHttp } from "@infrastructure/httpServer.js";

async function main() {
  try {
    await autoRegister({
      container, // optionnel, par défaut c’est le rootContainer
    });
    await startHttp();
  } catch (err) {
    console.error("Fatal startup 2 error:", err);
    process.exit(1);
  }
}

main();
