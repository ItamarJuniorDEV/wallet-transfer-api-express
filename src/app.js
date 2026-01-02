import express from "express";
import indexRouter from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";

export const app = express();
app.use(express.json());

app.get("/health", (req, res) => res.json(
  { ok: true }
));

app.use("/api", indexRouter);

app.use(errorHandler);
