import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_COOKIE_NAME,
  clearAdminSessionCookie,
  deleteAdminSession,
} from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (token) {
    await deleteAdminSession(token);
  }
  await clearAdminSessionCookie();
  return NextResponse.json({ ok: true });
}
