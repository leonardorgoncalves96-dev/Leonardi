import express from "express";
import cors from "cors";
import { logger } from "./middleware/logger";
import whatsappRoutes from "./routes/whatsappRoutes";
import adminRoutes from "./routes/adminRoutes";
import { errorHandler } from "./middleware/errorHandler";
import { adminAuth } from "./middleware/adminAuth";

const app = express();

app.use(logger);
app.use(express.json({ limit: "2mb" }));
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/webhooks", whatsappRoutes);
app.use("/admin", adminAuth, adminRoutes);

app.use(errorHandler);

export default app;
