import { createAuthClient } from "better-auth/react";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export const authClient = createAuthClient({
  baseURL: API_URL,
  fetchOptions: { credentials: "include" }, // send the session cookie cross-origin
});
