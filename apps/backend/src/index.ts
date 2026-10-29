import "@core/env/load-env.js";
import "reflect-metadata";
import { startHttp } from "@infrastructure/http-server.js";

async function main() {
  try {
    // await autoRegister({
    //   container, // optionnel, par défaut c’est le rootContainer
    // });
    const port: number = parseInt(process.env.PORT || "3000");

    await startHttp(port);
  } catch (err) {
    console.error("Fatal startup 2 error:", err);
    process.exit(1);
  }
}

main();
