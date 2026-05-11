import { jest } from "@jest/globals";

import { sendError, sendSuccess } from "../../../src/utils/apiResponse.js";

function createResMock() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("apiResponse utils", () => {
  test("sendSuccess responds with status, message, data and meta", () => {
    const res = createResMock();
    sendSuccess(res, 201, "Created", { id: "1" }, { page: 1 });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "Created",
      data: { id: "1" },
      meta: { page: 1 },
    });
  });

  test("sendSuccess omits data and meta when they are null", () => {
    const res = createResMock();
    sendSuccess(res, 200, "Ok");

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "Ok",
    });
  });

  test("sendError responds with error payload", () => {
    const res = createResMock();
    sendError(res, 400, "Bad request");

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Bad request",
    });
  });
});
