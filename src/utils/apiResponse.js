const sendSuccess = (res, statusCode = 200, message = "Success", data = null, meta = null) => {
  const payload = { status: "success", message };
  if (data !== null) payload.data = data;
  if (meta !== null) payload.meta = meta;
  return res.status(statusCode).json(payload);
};

const sendError = (res, statusCode = 500, message = "Internal Server Error") => {
  return res.status(statusCode).json({ status: "error", message });
};

export { sendSuccess, sendError };