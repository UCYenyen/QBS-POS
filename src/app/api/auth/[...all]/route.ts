// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// This automatically handles GET and POST requests for all auth routes
export const { GET, POST } = toNextJsHandler(auth);