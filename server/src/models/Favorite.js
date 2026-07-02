import mongoose from "mongoose";
import { artworkSnapshotSchema } from "./artworkSnapshot.js";

const favoriteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    artwork: { type: artworkSnapshotSchema, required: true },
  },
  { timestamps: true }
);

favoriteSchema.index(
  { userId: 1, "artwork.source": 1, "artwork.sourceId": 1 },
  { unique: true }
);

export const Favorite = mongoose.model("Favorite", favoriteSchema);
