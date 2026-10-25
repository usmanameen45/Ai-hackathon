import rateLimit from "express-rate-limit";

const base = { standardHeaders: "draft-7", legacyHeaders: false };

export const apiLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 300,
  message: { message: "Too many requests, please try again later." },
});

export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 50,
  message: { message: "Too many auth attempts, please try again later." },
});
