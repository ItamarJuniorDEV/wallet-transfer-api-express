import { userRepository } from "../repositories/userRepository.js";
import { transferRepository } from "../repositories/transferRepository.js";
import { AppError } from "../errors/AppError.js";
import { authorizationClient } from "../clients/authorizationClient.js";
import { notificationClient } from "../clients/notificationClient.js";

export const transferService = {
  async execute(input) {
    const payer = userRepository.findById(input.payer);
    if (!payer) throw new AppError("Payer not found", 404);

    if (payer.type === "MERCHANT") {
      throw new AppError("Merchant cannot transfer", 403);
    }

    const payee = userRepository.findById(input.payee);
    if (!payee) throw new AppError("Payee not found", 404);

    const valueCents = Math.round(input.value * 100);

    if (payer.balanceCents < valueCents) {
      throw new AppError("Insufficient balance", 422);
    }

    const auth = await authorizationClient.check();
    if (!auth.data.authorization) {
      throw new AppError("Transfer not authorized", 403);
    }

    const payerBefore = payer.balanceCents;
    const payeeBefore = payee.balanceCents;

    let updatedPayer;
    let updatedPayee;
    let transfer;

    try {
      updatedPayer = userRepository.addBalance(payer.id, -valueCents);
      if (!updatedPayer) throw new Error("Failed to update payer");

      updatedPayee = userRepository.addBalance(payee.id, +valueCents);
      if (!updatedPayee) throw new Error("Failed to update payee");

      transfer = transferRepository.create({
        valueCents,
        payerId: payer.id,
        payeeId: payee.id,
      });
    } catch (err) {
      userRepository.setBalance(payer.id, payerBefore);
      userRepository.setBalance(payee.id, payeeBefore);
      throw new AppError("Transfer failed and was rolled back", 500);
    }

    let notified = true;
    try {
      await notificationClient.notify();
    } catch (err) {
      notified = false;
      console.error("Notification failed:", err);
    }

    return {
      message: "transferred",
      notified,
      transfer,
      balances: {
        payer: updatedPayer.balanceCents,
        payee: updatedPayee.balanceCents,
      },
    };
  },
};
