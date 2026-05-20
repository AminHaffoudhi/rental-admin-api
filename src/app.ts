import express from "express";
import helmet from "helmet";
import { corsOptions } from "@/middleware/cors.middleware";
import { errorMiddleware } from "@/middleware/error.middleware";
import { httpLoggerMiddleware } from "@/middleware/httpLogger.middleware";
import { requestIdMiddleware } from "@/middleware/requestId.middleware";
import apiRoutes from "@/routes/index";
import cors from "cors";

export function createApp(): express.Application {
  const app = express();

  app.use(requestIdMiddleware);
  app.use(cors(corsOptions));
  app.use(helmet());
  app.use(httpLoggerMiddleware);
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use("/api", apiRoutes);

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.originalUrl} does not exist.`,
      requestId: req.requestId,
    });
  });

  app.use(errorMiddleware);

  return app;
}
