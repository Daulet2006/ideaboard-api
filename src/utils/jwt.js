import jwt from "jsonwebtoken";

import config from "../config/config.js";

const signToken = (userId) => {
  return jwt.sign({ sub: userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

export { signToken, verifyToken };