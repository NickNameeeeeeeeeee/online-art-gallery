import jwt from "jsonwebtoken";
import { HttpError } from "../utils/httpError.js";

export const requireAuth = (req, res, next) => {
  const authorization = req.get("authorization") || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new HttpError(401, "Authentication is required."));
  }

  try {
    req.auth = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return next(new HttpError(401, "Your session is invalid or has expired."));
  }
};
