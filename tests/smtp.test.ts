import assert from "node:assert/strict";
import { test } from "node:test";
import { getSmtpCredentials } from "../lib/nodemailer/config";

test("SMTP configuration requires both server-side credentials", () => {
  assert.throws(() => getSmtpCredentials({}), /NODEMAILER_EMAIL and NODEMAILER_PASSWORD/);
  assert.deepEqual(
    getSmtpCredentials({ NODEMAILER_EMAIL: " mail@example.com ", NODEMAILER_PASSWORD: "app-password" }),
    { user: "mail@example.com", password: "app-password" },
  );
});
