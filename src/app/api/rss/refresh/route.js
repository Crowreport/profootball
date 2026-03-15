import { NextResponse } from "next/server";
import { fetchAllFeeds } from "@/lib/rssFetcher";
import { getCachedFeeds, setCachedFeeds, isCacheStale } from "@/lib/blobCache";

/**
 * POST /api/rss/refresh
 * Refreshes the RSS cache if it's stale.
 * Uses blob cache age as a distributed guard instead of module-level state
 * (which resets on every serverless cold start).
 * Awaits the fetch so it completes before the serverless context is frozen.
 */
export async function POST(request) {
  // Check whether the cache is still fresh enough to skip a refresh
  const cached = await getCachedFeeds();
  if (cached?.timestamp && !isCacheStale(cached.timestamp)) {
    console.log(`Refresh skipped — cache is only ${Math.round((Date.now() - cached.timestamp) / 1000)}s old`);
    return NextResponse.json({
      status: "skipped",
      message: "Cache is still fresh, no refresh needed",
    });
  }

  const startTime = Date.now();
  console.log("Refresh started at", new Date().toISOString());

  try {
    const data = await fetchAllFeeds(15);
    const success = await setCachedFeeds(data);
    const duration = Date.now() - startTime;

    console.log(
      `Refresh ${success ? "completed" : "failed"}: ` +
      `${data.sources?.length || 0} feeds in ${Math.round(duration / 1000)}s`
    );

    return NextResponse.json({
      status: "refreshed",
      feedCount: data.sources?.length || 0,
      duration: Math.round(duration / 1000),
    });
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rss/refresh
 * Returns current cache age so callers can determine freshness.
 */
export async function GET(request) {
  const cached = await getCachedFeeds();
  const ageMs = cached?.timestamp ? Date.now() - cached.timestamp : null;
  return NextResponse.json({
    hasCachedData: !!cached,
    cacheAgeSeconds: ageMs !== null ? Math.round(ageMs / 1000) : null,
    message: ageMs !== null
      ? `Cache is ${Math.round(ageMs / 1000)}s old`
      : "No cache present",
  });
}
