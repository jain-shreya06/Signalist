import assert from "node:assert/strict";
import { test } from "node:test";
import { getAuthenticatedUserId } from "../lib/auth/session";
import { validateSignInInput, validateSignUpInput } from "../lib/auth/validation";

const validSignUp = {
  email: "Investor@Example.com",
  password: "correct-horse-42",
  fullName: "Taylor Investor",
  country: "US",
  investmentGoals: "Growth",
  riskTolerance: "Medium",
  preferredIndustry: "Technology",
};

test("sign-up validation normalizes email and rejects invalid profile data", () => {
  assert.equal(validateSignUpInput(validSignUp)?.email, "investor@example.com");
  assert.equal(validateSignUpInput({ ...validSignUp, password: "short" }), null);
  assert.equal(validateSignUpInput({ ...validSignUp, country: "USA" }), null);
  assert.equal(validateSignUpInput({ ...validSignUp, investmentGoals: "crypto" }), null);
  assert.equal(validateSignUpInput({ ...validSignUp, fullName: "x\nadmin" }), null);
  assert.equal(validateSignUpInput(null), null);
});

test("sign-in validation rejects malformed credentials without logging them", () => {
  assert.deepEqual(validateSignInInput({ email: "A@Example.com", password: "valid-pass" }), {
    email: "a@example.com",
    password: "valid-pass",
  });
  assert.equal(validateSignInInput({ email: "invalid", password: "valid-pass" }), null);
  assert.equal(validateSignInInput({ email: "a@example.com", password: "" }), null);
});

test("session guard accepts only a non-empty server session user id", () => {
  assert.equal(getAuthenticatedUserId({ user: { id: "user-123" } }), "user-123");
  assert.equal(getAuthenticatedUserId(null), null);
  assert.equal(getAuthenticatedUserId(undefined), null);
  assert.equal(getAuthenticatedUserId({ user: { id: "" } }), null);
  assert.equal(getAuthenticatedUserId({ user: { id: 123 } }), null);
});
