"use server";

import { redirect } from "next/navigation";
import {
  registerUser as registerUserUtil,
  loginUser as loginUserUtil,
  createSession,
  clearSession,
} from "@/lib/auth";

/**
 * Server action for user registration
 */
export async function registerAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const name = formData.get("name") as string;

  // Validate input
  if (!email || !password || !confirmPassword || !name) {
    redirect("/register?error=all-fields-required");
  }

  if (password !== confirmPassword) {
    redirect("/register?error=passwords-dont-match");
  }

  try {
    const user = await registerUserUtil(email, password, name);
    await createSession(user.userId, user.email, user.name);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    // URL-encode the error message
    const encodedError = encodeURIComponent(message);
    redirect(`/register?error=${encodedError}`);
  }

  redirect("/dashboard");
}

/**
 * Server action for user login
 */
export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Validate input
  if (!email || !password) {
    redirect("/login?error=email-and-password-required");
  }

  try {
    const user = await loginUserUtil(email, password);
    await createSession(user.userId, user.email, user.name);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    // URL-encode the error message
    const encodedError = encodeURIComponent(message);
    redirect(`/login?error=${encodedError}`);
  }

  redirect("/dashboard");
}

/**
 * Server action for user logout
 */
export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
