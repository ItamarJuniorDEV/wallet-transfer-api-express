import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import request from "supertest";

import { ensureSchema, resetDb, getUserBalance, countTransfers } from "./db.js";
import { authorizationClient } from "../src/clients/authorizationClient.js";
import { notificationClient } from "../src/clients/notificationClient.js";
import { transferRepository } from "../src/repositories/transferRepository.js";

import { app } from "../src/app.js";

describe("POST /api/transfer", () => {
  beforeAll(async () => {
    await ensureSchema();
  });

  beforeEach(async () => {
    vi.restoreAllMocks();
    await resetDb();
  });

  it("sucesso: transfere e cria registro", async () => {
    vi.spyOn(authorizationClient, "check").mockResolvedValue({
      status: "success",
      data: { authorization: true },
    });

    vi.spyOn(notificationClient, "notify").mockResolvedValue({
      status: "success",
      data: { message: "Sent" },
    });

    const res = await request(app)
      .post("/api/transfer")
      .send({ value: 10, payer: 1, payee: 2 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("transferred");
    expect(res.body.notified).toBe(true);

    expect(await getUserBalance(1)).toBe(9000);
    expect(await getUserBalance(2)).toBe(51000);
    expect(await countTransfers()).toBe(1);
  });

  it("payer lojista: 403", async () => {
    const res = await request(app)
      .post("/api/transfer")
      .send({ value: 10, payer: 2, payee: 1 });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Merchant cannot transfer");

    expect(await getUserBalance(1)).toBe(10000);
    expect(await getUserBalance(2)).toBe(50000);
    expect(await countTransfers()).toBe(0);
  });

  it("saldo insuficiente: 422", async () => {
    vi.spyOn(authorizationClient, "check").mockResolvedValue({
      status: "success",
      data: { authorization: true },
    });

    const res = await request(app)
      .post("/api/transfer")
      .send({ value: 9999, payer: 1, payee: 2 });

    expect(res.status).toBe(422);
    expect(res.body.message).toBe("Insufficient balance");

    expect(await getUserBalance(1)).toBe(10000);
    expect(await getUserBalance(2)).toBe(50000);
    expect(await countTransfers()).toBe(0);
  });

  it("payee não existe: 404", async () => {
    vi.spyOn(authorizationClient, "check").mockResolvedValue({
      status: "success",
      data: { authorization: true },
    });

    const res = await request(app)
      .post("/api/transfer")
      .send({ value: 10, payer: 1, payee: 999 });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Payee not found");

    expect(await getUserBalance(1)).toBe(10000);
    expect(await countTransfers()).toBe(0);
  });

  it("payer não existe: 404", async () => {
    vi.spyOn(authorizationClient, "check").mockResolvedValue({
      status: "success",
      data: { authorization: true },
    });

    const res = await request(app)
      .post("/api/transfer")
      .send({ value: 10, payer: 999, payee: 1 });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Payer not found");

    expect(await getUserBalance(1)).toBe(10000);
    expect(await countTransfers()).toBe(0);
  });

  it("autorizador nega: 403 e não transfere", async () => {
    vi.spyOn(authorizationClient, "check").mockResolvedValue({
      status: "success",
      data: { authorization: false },
    });

    const res = await request(app)
      .post("/api/transfer")
      .send({ value: 10, payer: 1, payee: 2 });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Transfer not authorized");

    expect(await getUserBalance(1)).toBe(10000);
    expect(await getUserBalance(2)).toBe(50000);
    expect(await countTransfers()).toBe(0);
  });

  it("notificação falha: transfere mesmo assim e notified=false", async () => {
    vi.spyOn(authorizationClient, "check").mockResolvedValue({
      status: "success",
      data: { authorization: true },
    });

    vi.spyOn(notificationClient, "notify").mockRejectedValue(new Error("down"));

    const res = await request(app)
      .post("/api/transfer")
      .send({ value: 10, payer: 1, payee: 2 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("transferred");
    expect(res.body.notified).toBe(false);

    expect(await getUserBalance(1)).toBe(9000);
    expect(await getUserBalance(2)).toBe(51000);
    expect(await countTransfers()).toBe(1);
  });

  it("rollback real: erro ao salvar transfer faz rollback do saldo", async () => {
    vi.spyOn(authorizationClient, "check").mockResolvedValue({
      status: "success",
      data: { authorization: true },
    });

    vi.spyOn(notificationClient, "notify").mockResolvedValue({
      status: "success",
      data: { message: "Sent" },
    });

    vi.spyOn(transferRepository, "create").mockImplementation(async () => {
      throw new Error("boom");
    });

    const res = await request(app)
      .post("/api/transfer")
      .send({ value: 10, payer: 1, payee: 2 });

    expect(res.status).toBe(500);

    expect(await getUserBalance(1)).toBe(10000);
    expect(await getUserBalance(2)).toBe(50000);
    expect(await countTransfers()).toBe(0);
  });
});
