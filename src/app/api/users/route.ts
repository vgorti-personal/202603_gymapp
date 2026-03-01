import { NextResponse } from "next/server";

import { listUsers } from "@/lib/db/queries";

export async function GET() {
  try {
    const users = await listUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Unable to load users. Verify DATABASE_URL and migrations." },
      { status: 500 },
    );
  }
}
