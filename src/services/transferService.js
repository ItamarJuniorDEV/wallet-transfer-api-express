import { userRepository } from "../repositories/userRepository.js";
import { AppError } from "../errors/AppError.js";

export const transferService = {
  execute(input) {
    const payer = userRepository.findById(input.payer);

    if (!payer) {
      throw new AppError("Payer not found", 404);
    }

    if (payer.type === "MERCHANT") {
      throw new AppError("Merchant cannot transfer", 403);
    }

    return {
      message: "service ok",
      input,
    };
  },
};