import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { toUserFacingError } from "@/lib/ai/error";

export async function POST(request: Request) {
  const { email } = (await request.json().catch(() => ({}))) as {
    email?: string;
  };
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Service not configured", exists: false },
      { status: 500 },
    );
  }

  try {
    const target = email.trim().toLowerCase();
    const admin = createAdminClient();

    let page = 1;
    const perPage = 1000;
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) {
        console.error("[POST /api/auth/check-email] listUsers error:", error);
        return NextResponse.json({ error: "Could not verify email. Please try again.", exists: false }, { status: 500 });
      }
      const found = data.users.some((u) => u.email?.toLowerCase() === target);
      if (found) return NextResponse.json({ exists: true });
      if (data.users.length < perPage) break;
      page += 1;
      if (page > 20) break;
    }

    return NextResponse.json({ exists: false });
  } catch (err) {
    console.error("[POST /api/auth/check-email]", err);
    return NextResponse.json({ error: toUserFacingError(err), exists: false }, { status: 500 });
  }
}
