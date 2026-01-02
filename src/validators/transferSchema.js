import { z } from "zod";

export const transferSchema = z
.object({
  value: z.number().positive(),
  payer: z.number().int().positive(),
  payee: z.number().int().positive(),
})
.refine((data) => data.payer !== data.payee, {
  message: "payer and payee must be different",
  path: ["payee"],
});