export type SmtpEnvironment = {
  NODEMAILER_EMAIL?: string;
  NODEMAILER_PASSWORD?: string;
  [key: string]: string | undefined;
};

export function getSmtpCredentials(environment: SmtpEnvironment = process.env) {
  const user = environment.NODEMAILER_EMAIL?.trim();
  const password = environment.NODEMAILER_PASSWORD;
  if (!user || !password) {
    throw new Error("NODEMAILER_EMAIL and NODEMAILER_PASSWORD must be configured.");
  }
  return { user, password };
}
