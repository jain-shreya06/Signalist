'use server';

import { headers } from "next/headers";
import { getAuth } from "@/lib/better-auth/auth";
import { inngest } from "@/lib/inngest/client";
import { validateSignInInput, validateSignUpInput } from "@/lib/auth/validation";

export async function signUpWithEmail(input: unknown) {
  const validated = validateSignUpInput(input);
  if (!validated) return { success: false, error: "Invalid sign-up details." };

  try {
    const auth = await getAuth();
    await auth.api.signUpEmail({
      body: { email: validated.email, password: validated.password, name: validated.fullName },
    });

    try {
      await inngest.send({
        name: "app/user.created",
        data: {
          email: validated.email,
          name: validated.fullName,
        },
      });
    } catch {
      console.error("Unable to queue the welcome email workflow.");
    }

    return { success: true };
  } catch {
    console.error("Sign-up request failed.");
    return { success: false, error: "Unable to create the account. Check the details and try again." };
  }
}

export async function signInWithEmail(input: unknown) {
  const validated = validateSignInInput(input);
  if (!validated) return { success: false, error: "Enter a valid email and password." };

  try {
    const auth = await getAuth();
    await auth.api.signInEmail({ body: validated });
    return { success: true };
  } catch {
    console.error("Sign-in request failed.");
    return { success: false, error: "Email or password is incorrect." };
  }
}

export async function signOut() {
  try {
    const auth = await getAuth();
    await auth.api.signOut({ headers: await headers() });
    return { success: true };
  } catch {
    console.error("Sign-out request failed.");
    return { success: false, error: "Unable to sign out. Please try again." };
  }
}
