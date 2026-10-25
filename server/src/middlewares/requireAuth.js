import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../config/auth.js";
import { ApiError } from "../utils/ApiError.js";

export async function requireAuth(req, _res, next) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) throw new ApiError(401, "Authentication required");

  req.auth = session; // { user, session }
  next();
}
