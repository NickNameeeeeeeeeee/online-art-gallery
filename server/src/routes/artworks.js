import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getArtwork, getFeaturedArtworks, searchArtworks } from "../services/museumService.js";

const router = Router();

router.get(
  "/featured",
  asyncHandler(async (_req, res) => {
    res.json({ data: await getFeaturedArtworks() });
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = String(req.query.query || "art").trim().slice(0, 120);
    const source = ["all", "met", "artic"].includes(req.query.source) ? req.query.source : "all";
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(24, Math.max(1, Number.parseInt(req.query.limit, 10) || 12));
    const publicDomainOnly = req.query.publicDomain === "true";

    const result = await searchArtworks({ query, source, page, limit, publicDomainOnly });
    res.json({
      data: result.items,
      meta: { query, source, page, limit, total: result.total, warnings: result.warnings },
    });
  })
);

router.get(
  "/:source/:id",
  asyncHandler(async (req, res) => {
    res.json({ data: await getArtwork(req.params.source, req.params.id) });
  })
);

export default router;
