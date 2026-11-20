import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { getSmtpCredentials } from "@/lib/nodemailer/config";
import { sanitizeEmailHtml } from "@/lib/email/sanitize";
import { WELCOME_EMAIL_TEMPLATE, NEWS_SUMMARY_EMAIL_TEMPLATE } from "@/lib/nodemailer/templates";

let transporter: Transporter | undefined;

function getTransporter(): Transporter {
  if (transporter) return transporter;
  const auth = getSmtpCredentials();
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  return transporter;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function verifyEmailTransport(): Promise<void> {
  await getTransporter().verify();
}

export async function sendConfiguredTestEmail(): Promise<void> {
  const recipient = process.env.SMTP_TEST_RECIPIENT?.trim();
  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    throw new Error("SMTP_TEST_RECIPIENT must be configured to send a test email.");
  }
  const auth = getSmtpCredentials();
  await getTransporter().sendMail({
    from: auth.user,
    to: recipient,
    subject: "Signalist SMTP smoke test",
    text: "Signalist SMTP delivery verification.",
  });
}

export async function sendWelcomeEmail({ email, name, intro }: WelcomeEmailData): Promise<void> {
  const html = WELCOME_EMAIL_TEMPLATE
    .replace("{{name}}", escapeHtml(name))
    .replace("{{intro}}", sanitizeEmailHtml(intro));

  await getTransporter().sendMail({
    from: `"Signalist" <${getSmtpCredentials().user}>`,
    to: email,
    subject: "Welcome to Signalist - your stock market toolkit is ready!",
    text: "Thanks for joining Signalist",
    html,
  });
}

export async function sendNewsSummaryEmail(
  { email, date, newsContent }: { email: string; date: string; newsContent: string },
): Promise<void> {
  const html = NEWS_SUMMARY_EMAIL_TEMPLATE
    .replace("{{date}}", escapeHtml(date))
    .replace("{{newsContent}}", sanitizeEmailHtml(newsContent));

  await getTransporter().sendMail({
    from: `"Signalist News" <${getSmtpCredentials().user}>`,
    to: email,
    subject: `Market News Summary Today - ${date}`,
    text: "Today's market news summary from Signalist",
    html,
  });
}
