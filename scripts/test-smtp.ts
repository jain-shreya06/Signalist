import "dotenv/config";
import nodemailer from "nodemailer";
import { getSmtpCredentials } from "../lib/nodemailer/config";

async function main() {
  try {
    const credentials = getSmtpCredentials();
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: credentials,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
    await transporter.verify();
    console.log("SMTP connection and authentication verified.");

    if (process.env.SMTP_TEST_RECIPIENT?.trim()) {
      const recipient = process.env.SMTP_TEST_RECIPIENT.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
        console.log("NOT VERIFIED: SMTP_TEST_RECIPIENT is invalid; no email was sent.");
        process.exitCode = 2;
        return;
      }
      await transporter.sendMail({
        from: credentials.user,
        to: recipient,
        subject: "Signalist SMTP smoke test",
        text: "Signalist SMTP delivery verification.",
      });
      console.log("Test email sent to the explicitly configured test recipient.");
    } else {
      console.log("SMTP_TEST_RECIPIENT is not configured; no email was sent.");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("must be configured")) {
      console.log("NOT VERIFIED: SMTP credentials or test-recipient configuration are missing.");
      process.exitCode = 2;
      return;
    }
    const code = typeof error === "object" && error !== null && "code" in error
      && typeof error.code === "string" ? error.code : "unknown";
    console.error(`SMTP verification failed (error code: ${code}). Check SMTP authorization and network access.`);
    process.exitCode = 1;
  }
}

void main();
