import { pool } from "../src/infra/db/pool.js";

export async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      cpf VARCHAR(11) UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      type VARCHAR(10) NOT NULL CHECK (type IN ('COMMON','MERCHANT')),
      balance_cents BIGINT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS transfers (
      id BIGSERIAL PRIMARY KEY,
      value_cents BIGINT NOT NULL,
      payer_id INT NOT NULL REFERENCES users(id),
      payee_id INT NOT NULL REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

export async function resetDb() {
  await pool.query("TRUNCATE transfers RESTART IDENTITY CASCADE");
  await pool.query("TRUNCATE users RESTART IDENTITY CASCADE");

  await pool.query(
    `
    INSERT INTO users (full_name, cpf, email, type, balance_cents)
    VALUES
      ($1, $2, $3, $4, $5),
      ($6, $7, $8, $9, $10)
    `,
    [
      "User Common",
      "11111111111",
      "common@mail.com",
      "COMMON",
      10000,
      "User Merchant",
      "22222222222",
      "merchant@mail.com",
      "MERCHANT",
      50000,
    ]
  );
}

export async function getUserBalance(id) {
  const { rows } = await pool.query(
    "SELECT balance_cents FROM users WHERE id = $1",
    [Number(id)]
  );
  if (!rows[0]) return null;
  return Number(rows[0].balance_cents);
}

export async function countTransfers() {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS total FROM transfers");
  return rows[0].total;
}
