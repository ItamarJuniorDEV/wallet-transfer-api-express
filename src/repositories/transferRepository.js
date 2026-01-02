let nextId = 1;
let transfers = [];

export const transferRepository = {
  create({ valueCents, payerId, payeeId }) {
    const transfer = {
      id: nextId++,
      valueCents,
      payerId,
      payeeId,
      createdAt: new Date().toISOString(),
    };

    transfers.push(transfer);
    return transfer;
  },

  list() {
    return transfers;
  },

  reset() {
    nextId = 1;
    transfers = [];
  },
};
