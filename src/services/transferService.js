import { AppError } from "../errors/AppError.js";
import { authorizationClient } from "../clients/authorizationClient.js";
import { notificationClient } from "../clients/notificationClient.js";
import { withTransaction } from "../infra/db/withTransaction.js";
import { userRepository } from "../repositories/userRepository.js";
import { transferRepository } from "../repositories/transferRepository.js";

export const transferService = {
  async execute(input) {
    const valueCents = Math.round(input.value * 100);

    const auth = await authorizationClient.check();
    if (!auth.data.authorization) {
      throw new AppError("Transfer not authorized", 403);
    }

    const result = await withTransaction(async (client) => {
      const payer = await userRepository.findByIdForUpdate(client, input.payer);
      if (!payer) throw new AppError("Payer not found", 404);

      if (payer.type === "MERCHANT") {
        throw new AppError("Merchant cannot transfer", 403);
      }

      const payee = await userRepository.findByIdForUpdate(client, input.payee);
      if (!payee) throw new AppError("Payee not found", 404);

      if (payer.balance_cents < valueCents) {
        throw new AppError("Insufficient balance", 422);
      }

      const updatedPayer = await userRepository.addBalance(client, payer.id, -valueCents);
      const updatedPayee = await userRepository.addBalance(client, payee.id, +valueCents);

      const transfer = await transferRepository.create(client, {
        valueCents,
        payerId: payer.id,
        payeeId: payee.id,
      });

      return { transfer, updatedPayer, updatedPayee };
    });

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
      transfer: result.transfer,
      balances: {
        payer: result.updatedPayer.balance_cents,
        payee: result.updatedPayee.balance_cents,
      },
    };
  },
};
