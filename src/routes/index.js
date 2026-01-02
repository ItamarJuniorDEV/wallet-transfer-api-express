import { Router } from "express";
import { transferController } from "../controllers/transferController.js";

const router = Router();

router.post("/transfer", transferController.create)

export default router;