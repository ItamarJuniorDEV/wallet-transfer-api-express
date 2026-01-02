import { Router } from "express";
import { transferController } from "../controllers/transferController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

const router = Router();

router.post("/transfer", asyncHandler(transferController.create));

export default router;