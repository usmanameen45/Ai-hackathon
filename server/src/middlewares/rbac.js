import { ApiError } from "../utils/ApiError.js";

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.auth || !req.auth.user) {
      return next(new ApiError(401, "Unauthorized"));
    }

    const userRole = req.auth.user.role;

    if (Array.isArray(roles)) {
      if (!roles.includes(userRole)) {
        return next(new ApiError(403, "Forbidden: Insufficient permissions"));
      }
    } else if (userRole !== roles) {
      return next(new ApiError(403, "Forbidden: Insufficient permissions"));
    }

    next();
  };
};
