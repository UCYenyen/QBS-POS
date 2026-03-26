// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // You only need to pass the baseURL if your auth server 
  // is on a different domain than your frontend.
  baseURL: "http://localhost:3000" 
});

// Export handy hooks and functions for your components
export const { signIn, signUp, useSession, signOut } = authClient;