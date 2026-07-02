import app from "../server/src/app.js";
import { connectDatabase } from "../server/src/db.js";

const requiredVariables = ["MONGODB_URI", "JWT_SECRET"];

export default async function handler(req, res) {
  const missing = requiredVariables.filter((name) => !process.env[name]);
  if (missing.length) {
    console.error(`Missing required environment variables: ${missing.join(", ")}`);
    return res.status(500).json({ message: "The server is not configured correctly." });
  }

  try {
    await connectDatabase();
    return app(req, res);
  } catch (error) {
    console.error("Unable to connect to MongoDB:", error);
    return res.status(500).json({ message: "The database is temporarily unavailable." });
  }
}
