import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { and, eq, gt } from "drizzle-orm";

import { hashToken, randomToken } from "@/lib/crypto";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";

export const ADMIN_COOKIE_NAME = "gym_admin_session";
const SESSION_TTL_DAYS = 30;

function getSessionExpiryDate() {
  const date = new Date();
  date.setDate(date.getDate() + SESSION_TTL_DAYS);
  return date;
}

export async function createAdminSession() {
  const token = randomToken(24);
  const tokenHash = hashToken(token, env.sessionSecret);
  const expiresAt = getSessionExpiryDate();

  await db.insert(schema.adminSessions).values({
    sessionTokenHash: tokenHash,
    expiresAt,
  });

  return { token, expiresAt };
}

export async function deleteAdminSession(token: string) {
  const tokenHash = hashToken(token, env.sessionSecret);
  await db
    .delete(schema.adminSessions)
    .where(eq(schema.adminSessions.sessionTokenHash, tokenHash));
}

export async function isAdminRequest(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) {
    return false;
  }
  const tokenHash = hashToken(token, env.sessionSecret);
  const rows = await db
    .select({ id: schema.adminSessions.id })
    .from(schema.adminSessions)
    .where(
      and(
        eq(schema.adminSessions.sessionTokenHash, tokenHash),
        gt(schema.adminSessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return rows.length > 0;
}

export async function setAdminSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

export async function isAdminCookieSessionValid() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) {
    return false;
  }
  const tokenHash = hashToken(token, env.sessionSecret);
  const rows = await db
    .select({ id: schema.adminSessions.id })
    .from(schema.adminSessions)
    .where(
      and(
        eq(schema.adminSessions.sessionTokenHash, tokenHash),
        gt(schema.adminSessions.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return rows.length > 0;
}
