import { Router } from "express";
import crypto from "node:crypto";
import { Collection } from "../models/Collection.js";
import { User } from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

const router = Router();

const makeSlug = (title) => {
  const readable = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "exhibition";
  return `${readable}-${crypto.randomBytes(4).toString("hex")}`;
};

const normalizeItems = (items = []) =>
  items.slice(0, 100).map((item, index) => ({
    artwork: item.artwork,
    curatorNote: String(item.curatorNote || "").slice(0, 1200),
    position: index,
  }));

router.get(
  "/public/:slug",
  asyncHandler(async (req, res) => {
    const collection = await Collection.findOne({ slug: req.params.slug, isPublic: true });
    if (!collection) throw new HttpError(404, "Public exhibition not found.");
    res.json({ data: collection });
  })
);

router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const collections = await Collection.find({ ownerId: req.auth.sub }).sort({ updatedAt: -1 });
    res.json({ data: collections });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const collection = await Collection.findOne({ _id: req.params.id, ownerId: req.auth.sub });
    if (!collection) throw new HttpError(404, "Exhibition not found.");
    res.json({ data: collection });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const title = String(req.body.title || "").trim();
    if (!title) throw new HttpError(400, "Exhibition title is required.");

    const user = await User.findById(req.auth.sub);
    if (!user) throw new HttpError(401, "The account no longer exists.");

    const collection = await Collection.create({
      ownerId: user.id,
      ownerName: user.name,
      title,
      description: String(req.body.description || "").trim(),
      isPublic: Boolean(req.body.isPublic),
      slug: makeSlug(title),
      items: normalizeItems(req.body.items),
    });
    res.status(201).json({ data: collection });
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const title = String(req.body.title || "").trim();
    if (!title) throw new HttpError(400, "Exhibition title is required.");

    const collection = await Collection.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.auth.sub },
      {
        title,
        description: String(req.body.description || "").trim(),
        isPublic: Boolean(req.body.isPublic),
        items: normalizeItems(req.body.items),
      },
      { new: true, runValidators: true }
    );
    if (!collection) throw new HttpError(404, "Exhibition not found.");
    res.json({ data: collection });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const collection = await Collection.findOneAndDelete({ _id: req.params.id, ownerId: req.auth.sub });
    if (!collection) throw new HttpError(404, "Exhibition not found.");
    res.status(204).end();
  })
);

export default router;
