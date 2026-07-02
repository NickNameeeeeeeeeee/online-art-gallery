import mongoose from "mongoose";

export const artworkSnapshotSchema = new mongoose.Schema(
  {
    source: { type: String, enum: ["met", "artic"], required: true },
    sourceId: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    artist: { type: String, default: "Unknown artist", trim: true },
    date: { type: String, default: "Date unknown", trim: true },
    medium: { type: String, default: "", trim: true },
    imageUrl: { type: String, default: "" },
    thumbnailUrl: { type: String, default: "" },
    museumName: { type: String, required: true },
    museumUrl: { type: String, default: "" },
    isPublicDomain: { type: Boolean, default: false },
    creditLine: { type: String, default: "" },
  },
  { _id: false }
);
