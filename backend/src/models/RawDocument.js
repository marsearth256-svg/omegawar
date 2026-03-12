import mongoose from "mongoose";

const RawDocumentSchema = new mongoose.Schema(
  {
    sourceId: { type: String, required: true },
    sourceUrl: { type: String, required: true },
    url: { type: String, required: true },
    title: { type: String, required: true },
    text: { type: String, required: true },
    publishedAt: { type: Date },
    fetchedAt: { type: Date, required: true, default: () => new Date() },
    contentHash: { type: String, required: true, unique: true, index: true },
    meta: { type: Object },
  },
  { timestamps: true }
);

export const RawDocument =
  mongoose.models.RawDocument || mongoose.model("RawDocument", RawDocumentSchema);

