export const transferRepository = {
  async create(client, { valueCents, payerId, payeeId }) {
    const { rows } = await client.query(
      `INSERT INTO transfers (value_cents, payer_id, payee_id)
       VALUES ($1, $2, $3)
       RETURNING id, value_cents, payer_id, payee_id, created_at`,
      [Number(valueCents), Number(payerId), Number(payeeId)]
    );
    return rows[0];
  },
};
