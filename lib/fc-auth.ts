import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getUserById, getUserByUsername, createUser } from "./fc-redis";
import type { FCUser } from "./fc-types";

const SECRET = new TextEncoder().encode(
  process.env.FC_SECRET || process.env.ADMIN_SECRET || "fc-change-me",
);
const COOKIE_NAME = "fc_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30d

// Lightweight bcrypt-compatible password hashing using SubtleCrypto + scrypt-like.
// Vercel Edge runtime doesn't ship bcrypt; use PBKDF2 from Web Crypto.
const PBKDF2_ITERATIONS = 100_000;

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  const keyMat = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMat,
    256,
  );
  return `pbkdf2$${PBKDF2_ITERATIONS}$${b64(salt)}$${b64(new Uint8Array(bits))}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = parseInt(parts[1], 10);
  const salt = unb64(parts[2]);
  const expected = parts[3];
  const enc = new TextEncoder();
  const keyMat = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    keyMat,
    256,
  );
  const got = b64(new Uint8Array(bits));
  return constantTimeEq(got, expected);
}

function constantTimeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function b64(buf: Uint8Array): string {
  return btoa(String.fromCharCode(...buf));
}
function unb64(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  const buf = new ArrayBuffer(bin.length);
  const arr = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

export async function createTokenForUser(uid: string): Promise<string> {
  return new SignJWT({ uid })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(SECRET);
}

export async function verifyTokenAndGetUid(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return (payload.uid as string) || null;
  } catch {
    return null;
  }
}

export async function currentUser(): Promise<FCUser | null> {
  const c = await cookies();
  const token = c.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const uid = await verifyTokenAndGetUid(token);
  if (!uid) return null;
  const user = await getUserById(uid);
  if (!user) return null;
  // strip password_hash before returning
  const { password_hash: _ph, ...safe } = user;
  void _ph;
  return safe;
}

export async function signup(
  username: string,
  password: string,
  display_name: string,
): Promise<{ ok: true; uid: string } | { ok: false; error: string }> {
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return { ok: false, error: "Username must be 3-20 chars (letters/numbers/_)" };
  }
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters" };
  }
  if (!display_name || display_name.length < 1 || display_name.length > 30) {
    return { ok: false, error: "Display name must be 1-30 chars" };
  }
  const existing = await getUserByUsername(username);
  if (existing) return { ok: false, error: "Username already taken" };
  const hash = await hashPassword(password);
  const uid = crypto.randomUUID();
  await createUser(uid, username, hash, display_name);
  await setSessionCookie(uid);
  return { ok: true, uid };
}

export async function login(
  username: string,
  password: string,
): Promise<{ ok: true; uid: string } | { ok: false; error: string }> {
  const user = await getUserByUsername(username);
  if (!user) return { ok: false, error: "Invalid credentials" };
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return { ok: false, error: "Invalid credentials" };
  await setSessionCookie(user.id);
  return { ok: true, uid: user.id };
}

export async function logout(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}

async function setSessionCookie(uid: string): Promise<void> {
  const token = await createTokenForUser(uid);
  const c = await cookies();
  c.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}
