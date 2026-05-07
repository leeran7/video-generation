import { NextResponse } from "next/server";

import { getJobStatus } from "@/lib/inngest/job-status";
import { toUserFacingError } from "@/lib/ai/error";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const status = await getJobStatus(id);
    if (!status) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    return NextResponse.json(status);
  } catch (err) {
    console.error("[GET /api/jobs/[id]]", err);
    return NextResponse.json({ error: toUserFacingError(err) }, { status: 500 });
  }
}
