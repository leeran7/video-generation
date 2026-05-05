import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Match all routes except static files, Next.js internals, and the
    // Inngest webhook (which the dev server hits with PUT/POST and must
    // not be auth-gated).
    "/((?!_next/static|_next/image|favicon.ico|api/inngest|api/auth/check-email|login|register|forgot-password|reset-password|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
