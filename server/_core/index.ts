import "dotenv/config";
import express from "express";
import http from "http";
import { setupVite, serveStatic } from "./vite";
import cookieParser from "cookie-parser";
import cors from "cors";
import { appRouter } from "../routers";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createContext } from "./context";
import { midnightAuditHandler } from "../cronAudit";

const app = express();
const server = http.createServer(app);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

const allowedOrigins = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/.*\.manus\.computer$/,
  /^https?:\/\/.*\.manus\.space$/,
  /^https?:\/\/masterkanorcase\.online$/,
  /^https?:\/\/admin\.masterkanorcase\.online$/,
];

app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.some((pattern) => pattern.test(origin))) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.post("/api/cron/midnight-audit", midnightAuditHandler);
app.get("/api/cron/midnight-audit", midnightAuditHandler);

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

export function startServer() {
  (async () => {
    const port = process.env.PORT || 3000;

    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    server.listen(Number(port), "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${port}/`);
    });
  })();
}

startServer();
