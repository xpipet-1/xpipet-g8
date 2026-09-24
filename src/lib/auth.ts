import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createClient } from "@libsql/client";

// Crear cliente de Turso
const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: {
        modelName: "users",
        fields: {
          id: "id",
          name: "name",
          email: "email",
          emailVerified: "emailVerified",
          image: "image",
          createdAt: "created_at",
          updatedAt: "updated_at",
        },
      },
      session: {
        modelName: "sessions",
        fields: {
          id: "id",
          userId: "userId",
          token: "token",
          createdAt: "createdAt",
          updatedAt: "updatedAt",
          expiresAt: "expiresAt",
        },
      },
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
});