import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import { User } from "../src/models/User.js";

process.env.JWT_SECRET = "test-secret-that-is-long-enough";

test("authenticated users can change their password", async (t) => {
  const originalFindById = User.findById;
  const user = {
    passwordHash: await bcrypt.hash("old-password", 4),
    async save() {},
  };

  User.findById = () => ({ select: async () => user });
  const server = app.listen(0);
  t.after(() => {
    User.findById = originalFindById;
    server.close();
  });

  const address = server.address();
  assert.ok(address && typeof address === "object");
  const token = jwt.sign({ sub: "507f1f77bcf86cd799439011" }, process.env.JWT_SECRET);
  const response = await fetch(`http://127.0.0.1:${address.port}/api/auth/password`, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ currentPassword: "old-password", newPassword: "new-password" }),
  });

  assert.equal(response.status, 200);
  assert.equal(await bcrypt.compare("new-password", user.passwordHash), true);
  assert.deepEqual(await response.json(), { data: { message: "Password updated." } });
});

test("password changes reject an incorrect current password", async (t) => {
  const originalFindById = User.findById;
  const user = {
    passwordHash: await bcrypt.hash("old-password", 4),
    async save() {
      throw new Error("save should not be called");
    },
  };

  User.findById = () => ({ select: async () => user });
  const server = app.listen(0);
  t.after(() => {
    User.findById = originalFindById;
    server.close();
  });

  const address = server.address();
  assert.ok(address && typeof address === "object");
  const token = jwt.sign({ sub: "507f1f77bcf86cd799439011" }, process.env.JWT_SECRET);
  const response = await fetch(`http://127.0.0.1:${address.port}/api/auth/password`, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ currentPassword: "wrong-password", newPassword: "new-password" }),
  });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { message: "Your current password is incorrect." });
});
