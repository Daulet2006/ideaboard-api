import { signToken, verifyToken } from "../../../src/utils/jwt.js";

describe("jwt utils", () => {
  test("signToken creates JWT string", () => {
    const token = signToken("user-123");

    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  test("verifyToken returns payload with sub claim", () => {
    const token = signToken("user-42");
    const payload = verifyToken(token);

    expect(payload.sub).toBe("user-42");
    expect(typeof payload.iat).toBe("number");
    expect(typeof payload.exp).toBe("number");
  });

  test("verifyToken throws for malformed token", () => {
    expect(() => verifyToken("not-a-token")).toThrow();
  });

  test("verifyToken throws for token signed with a different secret", async () => {
    const jwtModule = await import("jsonwebtoken");
    const foreignToken = jwtModule.default.sign({ sub: "user-x" }, "foreign-secret");

    expect(() => verifyToken(foreignToken)).toThrow();
  });
});
