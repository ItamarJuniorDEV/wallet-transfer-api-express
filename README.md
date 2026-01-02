# Wallet Transfer API (Express + PostgreSQL)

REST API para transferência de saldo entre usuários, construída com Express e PostgreSQL. Implementa validação de saldo, autorização externa e notificação após a transferência, usando transação (BEGIN/COMMIT/ROLLBACK).

Autor: Itamar Junior

---

## Requisitos

* Node.js 20+
* PostgreSQL 16+
* npm

---

## Tecnologias

* Express
* PostgreSQL (`pg`)
* Zod (validação de entrada)
* Vitest + Supertest (testes)
* dotenv (variáveis de ambiente)

---

## Instalação

```bash
npm install
```

---

## Banco de dados

Crie o banco de desenvolvimento e as tabelas.

### Criar banco (dev)

```sql
CREATE DATABASE picpay;
```

### Criar tabelas

Rode no banco `picpay`:

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  cpf VARCHAR(11) UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('COMMON','MERCHANT')),
  balance_cents BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transfers (
  id BIGSERIAL PRIMARY KEY,
  value_cents BIGINT NOT NULL,
  payer_id INT NOT NULL REFERENCES users(id),
  payee_id INT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Seed (opcional)

```sql
INSERT INTO users (full_name, cpf, email, type, balance_cents)
VALUES
('User Common', '11111111111', 'common@mail.com', 'COMMON', 10000),
('User Merchant', '22222222222', 'merchant@mail.com', 'MERCHANT', 50000)
ON CONFLICT DO NOTHING;
```

---

## Variáveis de ambiente

Crie um arquivo `.env` na raiz:

```env
PORT=3000
DATABASE_URL=postgres://user:password@localhost:5432/picpay
```

Recomendado: não versionar `.env` e `.env.test`.

---

## Rodar a aplicação

```bash
npm run dev
```

Saúde da API:

* GET `/health`

---

## Endpoint

### POST `/api/transfer`

Body:

```json
{
  "value": 10,
  "payer": 1,
  "payee": 2
}
```

Resposta (exemplo):

```json
{
  "message": "transferred",
  "notified": true,
  "transfer": {
    "id": 1,
    "value_cents": 1000,
    "payer_id": 1,
    "payee_id": 2,
    "created_at":"<timestamp>" 
  },
  "balances": {
    "payer": 9000,
    "payee": 51000
  }
}
```

---

## Regras

* O pagador (payer) do tipo `MERCHANT` não pode transferir.
* O pagador precisa ter saldo suficiente.
* A autorização externa deve permitir a transferência.
* A transferência é feita em transação no PostgreSQL.
* A notificação é disparada após a transferência; se falhar, a transferência não é desfeita.

---

## Testes automatizados

### Criar banco de testes

Crie um banco separado para testes:

```sql
CREATE DATABASE picpay_test;
```

Crie o arquivo `.env.test` na raiz:

```env
DATABASE_URL=postgres://user:password@localhost:5432/picpay_test
```

Rodar testes:

```bash
npm test
```

---

## Estrutura (visão geral)

* `src/app.js` configuração do Express
* `src/routes` rotas HTTP
* `src/controllers` camada HTTP (entrada/saída)
* `src/services` regras do caso de uso (transferência)
* `src/repositories` acesso ao banco (SQL)
* `src/infra/db` pool e transação
* `src/clients` chamadas externas (autorização/notificação)
* `src/validators` schemas Zod
* `src/middlewares` async handler e error handler
* `tests` testes E2E com Supertest + Vitest

---

## Scripts

* `npm run dev` inicia com nodemon
* `npm test` roda os testes com vitest
* `npm run test:watch` roda testes em modo watch
