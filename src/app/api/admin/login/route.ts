import { NextResponse } from "next/server";

import { createAdminSession, setAdminSessionCookie } from "@/lib/admin-auth";
import { safeEqual } from "@/lib/crypto";
import { env } from "@/lib/env";
import { adminLoginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const matches = safeEqual(parsed.data.passcode, env.adminPasscode);
  if (!matches) {
    return NextResponse.json({ error: "Invalid passcode." }, { status: 401 });
  }

  const session = await createAdminSession();
  await setAdminSessionCookie(session.token, session.expiresAt);

  return NextResponse.json({ ok: true });
}
