import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { email } = (await request.json().catch(() => ({}))) as {
    email?: string;
  };
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY not set", exists: false },
      { status: 500 },
    );
  }

  const target = email.trim().toLowerCase();
  const admin = createAdminClient();

  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      return NextResponse.json(
        { error: error.message, exists: false },
        { status: 500 },
      );
    }
    const found = data.users.some((u) => u.email?.toLowerCase() === target);
    if (found) return NextResponse.json({ exists: true });
    if (data.users.length < perPage) break;
    page += 1;
    if (page > 20) break;
  }

  return NextResponse.json({ exists: false });
}
