import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import pinoHttp from "pino-http";
import { toNodeHandler } from "better-auth/node";

import { env } from "./config/env.js";
import { auth } from "./config/auth.js";
import { logger } from "./utils/logger.js";
import routes from "./routes/index.js";
import { apiLimiter, authLimiter } from "./middlewares/rateLimiter.js";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.set("trust proxy", 1); // needed behind Render/Railway/Nginx for correct IPs and secure cookies
app.disable("x-powered-by");

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(pinoHttp({ logger }));
app.use(compression());

// Better Auth MUST be mounted BEFORE express.json()
app.all("/api/auth/*splat", authLimiter, toNodeHandler(auth));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

export default app;
