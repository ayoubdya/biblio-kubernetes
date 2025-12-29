import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    NEXTAUTH_SECRET: z.string().min(1),
    NEXTAUTH_URL: z.string().url().optional(),
  },
  client: {
    NEXT_PUBLIC_KEYCLOAK_URL: z.string().url(),
    NEXT_PUBLIC_KEYCLOAK_REALM: z.string().min(1),
    NEXT_PUBLIC_KEYCLOAK_CLIENT_ID: z.string().min(1),
    NEXT_PUBLIC_CATALOG_SERVICE_URL: z.string().url(),
    NEXT_PUBLIC_USER_SERVICE_URL: z.string().url(),
    NEXT_PUBLIC_COMMENT_SERVICE_URL: z.string().url(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXT_PUBLIC_KEYCLOAK_URL: process.env.NEXT_PUBLIC_KEYCLOAK_URL,
    NEXT_PUBLIC_KEYCLOAK_REALM: process.env.NEXT_PUBLIC_KEYCLOAK_REALM,
    NEXT_PUBLIC_KEYCLOAK_CLIENT_ID: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID,
    NEXT_PUBLIC_CATALOG_SERVICE_URL: process.env.NEXT_PUBLIC_CATALOG_SERVICE_URL,
    NEXT_PUBLIC_USER_SERVICE_URL: process.env.NEXT_PUBLIC_USER_SERVICE_URL,
    NEXT_PUBLIC_COMMENT_SERVICE_URL: process.env.NEXT_PUBLIC_COMMENT_SERVICE_URL,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
