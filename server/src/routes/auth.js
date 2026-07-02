import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createToken = (user) =>
  jwt.sign({ sub: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (name.length < 2) throw new HttpError(400, "Name must contain at least two characters.");
    if (!emailPattern.test(email)) throw new HttpError(400, "Enter a valid email address.");
    if (password.length < 8) throw new HttpError(400, "Password must contain at least eight characters.");

    if (await User.exists({ email })) throw new HttpError(409, "An account with this email already exists.");

    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
    res.status(201).json({ data: { user, token: createToken(user) } });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new HttpError(401, "Email or password is incorrect.");
    }

    res.json({ data: { user: user.toJSON(), token: createToken(user) } });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.auth.sub);
    if (!user) throw new HttpError(401, "The account no longer exists.");
    res.json({ data: user });
  })
);

router.put(
  "/password",
  requireAuth,
  asyncHandler(async (req, res) => {
    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = String(req.body.newPassword || "");

    if (!currentPassword) throw new HttpError(400, "Enter your current password.");
    if (newPassword.length < 8) throw new HttpError(400, "The new password must contain at least eight characters.");
    if (currentPassword === newPassword) throw new HttpError(400, "Choose a password different from your current password.");

    const user = await User.findById(req.auth.sub).select("+passwordHash");
    if (!user) throw new HttpError(401, "The account no longer exists.");
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new HttpError(401, "Your current password is incorrect.");
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ data: { message: "Password updated." } });
  })
);

export default router;
