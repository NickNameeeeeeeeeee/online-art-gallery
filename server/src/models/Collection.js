import mongoose from "mongoose";
import { artworkSnapshotSchema } from "./artworkSnapshot.js";

const collectionItemSchema = new mongoose.Schema(
  {
    artwork: { type: artworkSnapshotSchema, required: true },
    curatorNote: { type: String, default: "", maxlength: 1200 },
    position: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const collectionSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    ownerName: { type: String, required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", trim: true, maxlength: 2000 },
    isPublic: { type: Boolean, default: false },
    slug: { type: String, required: true, unique: true, index: true },
    items: { type: [collectionItemSchema], default: [] },
  },
  { timestamps: true }
);

collectionSchema.set("toJSON", {
  transform: (_doc, result) => {
    delete result.__v;
    return result;
  },
});

export const Collection = mongoose.model("Collection", collectionSchema);
