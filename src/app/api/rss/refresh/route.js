import { NextResponse } from "next/server";
import { fetchAllFeeds } from "@/lib/rssFetcher";
import { setCachedFeeds } from "@/lib/blobCache";

// Track if a refresh is currently in progress to prevent duplicate refreshes
let refreshInProgress = false;

/**
 * POST /api/rss/refresh
 * Triggers a background refresh of the RSS cache
 * Returns immediately while the refresh happens in the background
 */
export async function POST(request) {
  // Prevent duplicate refreshes
  if (refreshInProgress) {
    console.log("Refresh already in progress, skipping");
    return NextResponse.json({
      status: "skipped",
      message: "Refresh already in progress",
    });
  }

  // Start the refresh in the background (fire-and-forget)
  refreshInProgress = true;

  // Use setImmediate-like pattern to allow response to return first
  const refreshPromise = (async () => {
    const startTime = Date.now();
    console.log("Background refresh started at", new Date().toISOString());

    try {
      const data = await fetchAllFeeds(15); // Process 15 feeds at a time
      const success = await setCachedFeeds(data);

      const duration = Date.now() - startTime;
      console.log(
        `Background refresh ${success ? "completed" : "failed"}: ` +
        `${data.sources?.length || 0} feeds in ${Math.round(duration / 1000)}s`
      );

      return { success, feedCount: data.sources?.length || 0, duration };
    } catch (error) {
      console.error("Background refresh error:", error);
      return { success: false, error: error.message };
    } finally {
      refreshInProgress = false;
    }
  })();

  // Don't await - let it run in background
  refreshPromise.catch((err) => {
    console.error("Unhandled refresh error:", err);
    refreshInProgress = false;
  });

  // Return immediately
  return NextResponse.json({
    status: "refreshing",
    message: "Cache refresh started in background",
    startedAt: new Date().toISOString(),
  });
}

/**
 * GET /api/rss/refresh
 * Check the status of the refresh process
 */
export async function GET(request) {
  return NextResponse.json({
    refreshInProgress,
    message: refreshInProgress
      ? "A refresh is currently running"
      : "No refresh in progress",
  });
}
