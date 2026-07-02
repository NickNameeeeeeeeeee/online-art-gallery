import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectDatabase } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const port = Number(process.env.PORT) || 5000;
const requiredVariables = ["MONGODB_URI", "JWT_SECRET"];
const missing = requiredVariables.filter((name) => !process.env[name]);

if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

try {
  const { default: app } = await import("./app.js");
  await connectDatabase();
  app.listen(port, () => {
    console.log(`Online Art Gallery server listening on http://localhost:${port}`);
  });
} catch (error) {
  console.error("Unable to start the server:", error);
  process.exit(1);
}
