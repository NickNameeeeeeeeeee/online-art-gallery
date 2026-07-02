import { Router } from "express";
import { Favorite } from "../models/Favorite.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const favorites = await Favorite.find({ userId: req.auth.sub }).sort({ createdAt: -1 });
    res.json({ data: favorites });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    if (!req.body.artwork?.source || !req.body.artwork?.sourceId || !req.body.artwork?.title) {
      throw new HttpError(400, "A valid artwork snapshot is required.");
    }

    try {
      const favorite = await Favorite.create({ userId: req.auth.sub, artwork: req.body.artwork });
      res.status(201).json({ data: favorite });
    } catch (error) {
      if (error.code === 11000) throw new HttpError(409, "This artwork is already in your favorites.");
      throw error;
    }
  })
);

router.delete(
  "/:source/:sourceId",
  asyncHandler(async (req, res) => {
    const favorite = await Favorite.findOneAndDelete({
      userId: req.auth.sub,
      "artwork.source": req.params.source,
      "artwork.sourceId": req.params.sourceId,
    });
    if (!favorite) throw new HttpError(404, "Favorite not found.");
    res.status(204).end();
  })
);

export default router;
