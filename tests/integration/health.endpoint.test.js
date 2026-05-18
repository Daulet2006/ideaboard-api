import request from "supertest";

import app from "../../src/app.js";

describe("API integration", () => {
  test("GET /api/health returns status ok and ISO timestamp", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ok" });
    expect(typeof res.body.timestamp).toBe("string");
    expect(Number.isNaN(Date.parse(res.body.timestamp))).toBe(false);
  });

  test("unknown API route returns 404 with fail status", async () => {
    const res = await request(app).get("/api/not-existing-route");

    expect(res.status).toBe(404);
    expect(res.body.status).toBe("fail");
    expect(res.body.message).toContain("Route GET /api/not-existing-route not found.");
  });

  test("GET /api/ideas/popular validates query params", async () => {
    const res = await request(app).get("/api/ideas/popular?page=0&limit=1000");

    expect(res.status).toBe(422);
    expect(res.body.status).toBe("fail");
    expect(typeof res.body.message).toBe("string");
    expect(res.body.message).toContain("must be greater than or equal to 1");
  });

  test("GET /api/auth/notifications/unread-count requires auth", async () => {
    const res = await request(app).get("/api/auth/notifications/unread-count");

    expect(res.status).toBe(401);
    expect(res.body.status).toBe("fail");
    expect(typeof res.body.message).toBe("string");
  });
});
