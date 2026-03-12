import { describe, it, expect } from "vitest";
import { connectDb } from "../db.js";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

describe("db.connect", () => {
  const skip = process.env.COVERAGE === "true";
  const testFn = skip ? it.skip : it;
  testFn("connects to MongoDB", async () => {
    const mongod = await MongoMemoryServer.create();
    await connectDb(mongod.getUri());
    expect(mongoose.connection.readyState).toBe(1);
    await mongoose.disconnect();
    await mongod.stop();
  }, 20000);
});
