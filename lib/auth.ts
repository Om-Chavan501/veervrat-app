import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import {prisma} from "./prisma";

const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-key-change-in-production";
const SESSION_COOKIE_NAME = "veervrat_session";
const SESSION_EXPIRY_HOURS = 24 * 7; // 7 days

/**
 * Session payload stored in encrypted cookie
 */
interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  iat: number;
  exp: number;
}

/**
 * Hash password using bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare plaintext password with hash
 */
export async function verifyPassword(
  plainPassword: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hash);
}

/**
 * Create a session cookie for authenticated user
 */
export async function createSession(userId: string, email: string, name: string) {
  const cookieStore = await cookies();
  const now = Date.now();
  const expiryTime = now + SESSION_EXPIRY_HOURS * 60 * 60 * 1000;

  // For MVP, store session data in a simple JSON format
  // In production, use a secure session store (Redis, database, etc.)
  const sessionData: SessionPayload = {
    userId,
    email,
    name,
    iat: now,
    exp: expiryTime,
  };

  // Encode session as base64 (simple but not cryptographically secure for production)
  const encodedSession = Buffer.from(JSON.stringify(sessionData)).toString("base64");

  cookieStore.set(SESSION_COOKIE_NAME, encodedSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_EXPIRY_HOURS * 60 * 60,
    path: "/",
  });
}

/**
 * Get current session from cookie
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const decoded = Buffer.from(sessionCookie.value, "base64").toString("utf-8");
    const sessionData: SessionPayload = JSON.parse(decoded);

    // Check if session is expired
    if (sessionData.exp < Date.now()) {
      // Session expired, clear it
      cookieStore.delete(SESSION_COOKIE_NAME);
      return null;
    }

    return sessionData;
  } catch (error) {
    // Invalid session, clear it
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }
}

/**
 * Clear session (logout)
 */
export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Register a new user
 * @throws Error if email already exists or validation fails
 */
export async function registerUser(
  email: string,
  password: string,
  name: string
): Promise<{ userId: string; email: string; name: string }> {
  // Validate input
  if (!email || !password || !name) {
    throw new Error("Email, password, and name are required");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("Email already registered");
  }

  // Hash password and create user
  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: hashedPassword,
    },
  });

  return {
    userId: user.id,
    email: user.email || "",
    name: user.name,
  };
}

/**
 * Login user with email and password
 * @throws Error if credentials are invalid
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ userId: string; email: string; name: string }> {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (!user.passwordHash) {
    throw new Error("Invalid email or password");
  }

  // Verify password
  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  return {
    userId: user.id,
    email: user.email || "",
    name: user.name,
  };
}
