import mongoose from "mongoose";

const LocationSchema = new mongoose.Schema(
  {
    name: { type: String },
    country: { type: String },
    lat: { type: Number },
    lng: { type: Number },
    precision: { type: String, enum: ["exact", "city", "region", "country", "unknown"], default: "unknown" },
  },
  { _id: false }
);

const EventSchema = new mongoose.Schema(
  {
    eventKey: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    summaryShort: { type: String, required: true },
    summaryLong: { type: String },
    eventType: { type: String, required: true, index: true },
    severity: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], required: true, index: true },
    riskScore: { type: Number, min: 0, max: 100, required: true, index: true },
    confidence: { type: Number, min: 0, max: 1, required: true },
    countries: { type: [String], default: [], index: true },
    actors: { type: [String], default: [] },
    tags: { type: [String], default: [], index: true },
    militaryActivityDetected: { type: Boolean, default: false, index: true },
    sources: {
      type: [
        {
          sourceId: String,
          url: String,
          publishedAt: Date,
          rawDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: "RawDocument" },
        },
      ],
      default: [],
    },
    primaryLocation: { type: LocationSchema },
    locations: { type: [LocationSchema], default: [] },
    status: { type: String, enum: ["open", "closed"], default: "open", index: true },
  },
  { timestamps: true }
);

EventSchema.index({ createdAt: -1 });
EventSchema.index({ title: "text", summaryShort: "text", summaryLong: "text", tags: "text", actors: "text" });

export const Event = mongoose.models.Event || mongoose.model("Event", EventSchema);

