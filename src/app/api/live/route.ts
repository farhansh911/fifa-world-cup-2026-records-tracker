import { NextResponse } from "next/server";
import { getFeaturedMatchView, getLiveMatchViews } from "@/lib/live-matches";

export const dynamic = "force-dynamic";

export async function GET() {
  const [live, featured] = await Promise.all([
    getLiveMatchViews(),
    getFeaturedMatchView(),
  ]);

  return NextResponse.json({
    live,
    featured: live.length === 0 ? featured : null,
    updatedAt: new Date().toISOString(),
  });
}
