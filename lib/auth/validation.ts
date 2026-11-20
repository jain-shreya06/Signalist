import { INVESTMENT_GOALS, PREFERRED_INDUSTRIES, RISK_TOLERANCE_OPTIONS } from "@/lib/constants";

export type ValidSignUpInput = {
  email: string;
  password: string;
  fullName: string;
  country: string;
  investmentGoals: string;
  riskTolerance: string;
  preferredIndustry: string;
};

export type ValidSignInInput = {
  email: string;
  password: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEmail(value: unknown): value is string {
  return typeof value === "string"
    && value.length <= 254
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= 8 && value.length <= 128;
}

function isOption(value: unknown, options: readonly { value: string }[]): value is string {
  return typeof value === "string" && options.some((option) => option.value === value);
}

export function validateSignInInput(value: unknown): ValidSignInInput | null {
  if (!isRecord(value) || !isEmail(value.email) || !isPassword(value.password)) return null;
  return { email: value.email.trim().toLowerCase(), password: value.password };
}

export function validateSignUpInput(value: unknown): ValidSignUpInput | null {
  if (!isRecord(value)
    || !isEmail(value.email)
    || !isPassword(value.password)
    || typeof value.fullName !== "string"
    || value.fullName.trim().length < 2
    || value.fullName.trim().length > 100
    || /[\u0000-\u001f\u007f]/.test(value.fullName)
    || typeof value.country !== "string"
    || !/^[A-Z]{2}$/.test(value.country)
    || !isOption(value.investmentGoals, INVESTMENT_GOALS)
    || !isOption(value.riskTolerance, RISK_TOLERANCE_OPTIONS)
    || !isOption(value.preferredIndustry, PREFERRED_INDUSTRIES)) return null;

  return {
    email: value.email.trim().toLowerCase(),
    password: value.password,
    fullName: value.fullName.trim(),
    country: value.country,
    investmentGoals: value.investmentGoals,
    riskTolerance: value.riskTolerance,
    preferredIndustry: value.preferredIndustry,
  };
}
