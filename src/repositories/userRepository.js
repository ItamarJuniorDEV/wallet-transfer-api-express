const users = new Map([
  [1, { id: 1, type: "COMMON", balanceCents: 10_000}],
  [2, { id: 2, type: "MERCHANT", balanceCents: 50_000}],
]);

export const userRepository = {
  findById(id) {
    return users.get(Number(id)) ?? null;
  },
};