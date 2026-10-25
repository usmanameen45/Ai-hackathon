import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";

// Minimal env so config validation passes. No database connection is needed for these routes.
beforeAll(() => {
  process.env.NODE_ENV = "test";
  process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/test";
  process.env.CLIENT_URL = "http://localhost:5173";
  process.env.BETTER_AUTH_SECRET = "test-secret-test-secret-test-secret-123";
  process.env.BETTER_AUTH_URL = "http://localhost:5000";
});

describe("API", () => {
  it("GET /api/health returns ok", async () => {
    const { default: app } = await import("../src/app.js");
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("GET /api/unknown returns 404", async () => {
    const { default: app } = await import("../src/app.js");
    const res = await request(app).get("/api/unknown");
    expect(res.status).toBe(404);
  });
});
