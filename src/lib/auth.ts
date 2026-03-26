// lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./prisma"; // Import the singleton we just created

export const auth = betterAuth({
  // Connect Prisma! 
  // Change "postgresql" to "mysql" or "sqlite" if you are using something else
  database: prismaAdapter(prisma, {
    provider: "postgresql", 
  }),
  
  emailAndPassword: {
    enabled: true,
  },
  
  plugins: [nextCookies()]
});