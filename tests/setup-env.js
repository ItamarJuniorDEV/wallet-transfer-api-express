import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL not found. Create .env.test with DATABASE_URL");
}
