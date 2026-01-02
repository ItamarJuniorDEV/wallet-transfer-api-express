const seedUsers = () =>
  new Map([
    [1, { id: 1, type: "COMMON", balanceCents: 10_000 }],
    [2, { id: 2, type: "MERCHANT", balanceCents: 50_000 }],
  ]);

let users = seedUsers();

export const userRepository = {
  findById(id) {
    return users.get(Number(id)) ?? null;
  },

  addBalance(id, deltaCents) {
    const user = users.get(Number(id));
    if (!user) return null;

    user.balanceCents += Number(deltaCents);
    return user;
  },

  setBalance(id, balanceCents) {
    const user = users.get(Number(id));
    if (!user) return null;

    user.balanceCents = Number(balanceCents);
    return user;
  },

  reset() {
    users = seedUsers();
  },
};
