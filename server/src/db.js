import mongoose from "mongoose";

const cache = globalThis.__atelierMongoose || { connection: null, promise: null };
globalThis.__atelierMongoose = cache;

export const connectDatabase = async () => {
  if (cache.connection) return cache.connection;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing required environment variable: MONGODB_URI");

  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
    });
  }

  try {
    cache.connection = await cache.promise;
    return cache.connection;
  } catch (error) {
    cache.promise = null;
    throw error;
  }
};
