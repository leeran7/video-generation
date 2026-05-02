import { NextResponse } from "next/server";

import { getJobStatus } from "@/lib/inngest/job-status";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const status = await getJobStatus(id);
  if (!status) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  return NextResponse.json(status);
}
