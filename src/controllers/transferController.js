import { transferSchema } from "../validators/transferSchema.js";
import { transferService } from "../services/transferService.js";
import { AppError } from "../errors/AppError.js";

export const transferController = {
  create(req, res) {
    const parsed = transferSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError("Invalid request body", 400);
    }
    const result = transferService.execute(parsed.data);
    return res.status(200).json(result);
  },
};
