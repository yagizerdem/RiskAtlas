import express from "express";
import { container } from "tsyringe";
import { TOKENS } from "@core/di/tokens.js";
import { ILogger } from "@core/logging/ILogger.js";
import { setupGlobalErrorHandlers } from "@core/logging/setupGlobalErrorHandlers.js";
import { printStartupCli } from "@core/cli/startup-banner.js";
import { IHttpRequestLogger } from "@infrastructure/http/interfaces/IHttpRequestLogger.js";
import { attachRequestLogger } from "./http/middleware/request-logger.middleware.js";
import { errorMiddleware } from "@infrastructure/http/middleware/error.middleware.js";
import { HttpSecurityBuilder } from "@infrastructure/security/security-filter-chain.js";
import { helmetMiddleware } from "@infrastructure/security/middleware/helmet.middleware.js";
import { corsMiddleware } from "@infrastructure/security/middleware/cors.middleware.js";
import { rateLimitMiddleware } from "@infrastructure/security/middleware/rateLimit.middleware.js";
import { connectDb } from "@infrastructure/db/db.js";
import { isPortAvailable } from "@infrastructure/util/port-util.js";
import mongoose from "mongoose";
import { HttpStatusCode } from "@riskatlas/shared";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import { options } from "@infrastructure/swagger/options.js";

export async function createApp() {
  // process-level error handling setup
  setupGlobalErrorHandlers();

  // Initialize DB
  await connectDb();
  console.log(`Database connection state: ${mongoose.connection.readyState}`);

  const app = express();
  app.set("trust proxy", true);

  // Security Filter Chain
  const securityFilterChain = new HttpSecurityBuilder()
    .addFilter(helmetMiddleware())
    .addFilter(corsMiddleware())
    .addFilter(rateLimitMiddleware())
    .authorizeHttpRequests((auth) => {
      // development routes
      auth.requestMatchers("/health").permitAll();
      auth.requestMatchers("/error").permitAll();

      // production routes
      auth.requestMatchers("/api/auth/**").permitAll(); // Public for demo
      auth.requestMatchers("/greet/*").permitAll(); // Public for demo
      auth.requestMatchers("/admin/**").authenticated(); // Example
    })
    .build();

  app.use(securityFilterChain.getMiddleware());

  //  HTTP logging
  const httpRequestLogger = container.resolve<IHttpRequestLogger>(
    TOKENS.HttpRequestLogger,
  );
  app.use(httpRequestLogger.getMiddleware());

  app.use(attachRequestLogger);

  //  Body parsing
  app.use(express.json());
  const specs = swaggerJSDoc(options);

  if (process.env.NODE_ENV === "development") {
    // swagger
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
  }

  //  Routes

  app.get("/health", (req, res) => {
    res
      .status(HttpStatusCode.OK)
      .json({ status: "UP", timestamp: new Date().toISOString() });
  });

  if (process.env.NODE_ENV === "development") {
    app.get("/error", () => {
      throw new Error("Simulated error for testing purposes");
    });
  }

  // // User Routes
  const { authRouter } =
    await import("@modules/auth/infrastructure/http/auth.route.js");
  app.use("/api/auth", authRouter);

  // Risk Routes
  const { riskRouter } =
    await import("@modules/risk/infrastructure/http/risk.route.js");
  app.use("/api/risk", riskRouter);

  app.use(errorMiddleware);

  return app;
}

export async function startHttp(port: number) {
  const bootStart = Date.now();
  const app = await createApp();

  const appLogger = container.resolve<ILogger>(TOKENS.Logger);
  const env = process.env.NODE_ENV || "development";
  const host = process.env.HOST || "localhost";
  const appName = process.env.APP_NAME || "RiskAtlasAPI";
  const version = process.env.APP_VERSION || "1.0.0";

  if (!(await isPortAvailable(port))) {
    appLogger.error(
      `Port ${port} is already in use. Please free the port or use another one.`,
      {
        context: "Bootstrap",
        port,
      },
    );
    process.exit(1);
  }

  // Initialize DB for logging purposes if needed (already done in createApp)

  const server = app.listen(port, () => {
    const bootTimeMs = Date.now() - bootStart;

    // Banner CLI friendly
    printStartupCli({
      appName,
      version,
      env,
      port,
      host,
      bootTimeMs,
      dbType: "mongo",
      dbAddress: process.env.MONGODB_URI || "unknown",
    });

    // Log technique via ILogger
    appLogger.info("Server listening", {
      context: "Bootstrap",
      port,
      env,
      host,
      bootTimeMs,
    });
  });

  // Graceful Shutdown
  const shutdown = async (signal: string) => {
    appLogger.info(`${signal} received. Starting graceful shutdown...`, {
      context: "Shutdown",
    });

    // Stop accepting new connections
    server.close(async () => {
      appLogger.info("HTTP server closed.", { context: "Shutdown" });

      //  Close DB connection
      if (mongoose.connection.readyState) {
        await mongoose.connection.close();
        appLogger.info("Database connection closed.", { context: "Shutdown" });
      }

      appLogger.info("Graceful shutdown completed. Bye!", {
        context: "Shutdown",
      });
      process.exit(0);
    });

    // Force exit if shutdown takes too long
    setTimeout(() => {
      appLogger.error("Forcing shutdown after timeout.", {
        context: "Shutdown",
      });
      process.exit(1);
    }, 10_000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGUSR2", () => shutdown("SIGUSR2"));
}
