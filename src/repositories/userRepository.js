export const userRepository = {
  async findByIdForUpdate(client, id) {
    const { rows } = await client.query(
      `SELECT id, type, balance_cents
       FROM users
       WHERE id = $1
       FOR UPDATE`,
      [Number(id)]
    );
    return rows[0] ?? null;
  },

  async addBalance(client, id, deltaCents) {
    const { rows } = await client.query(
      `UPDATE users
       SET balance_cents = balance_cents + $1
       WHERE id = $2
       RETURNING id, type, balance_cents`,
      [Number(deltaCents), Number(id)]
    );
    return rows[0] ?? null;
  },
};
