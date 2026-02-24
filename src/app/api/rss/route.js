import { NextResponse } from "next/server";
import { checkRateLimit } from "@/utils/ratelimit";
import {
  getCachedFeeds,
  setCachedFeeds,
  clearCache,
  getCacheStatus
} from "@/lib/blobCache";
import { fetchAllFeeds } from "@/lib/rssFetcher";

/**
 * Create consistent cache metadata for API responses
 */
function createCacheMetadata({ age = 0, stale = false, refreshing = false, error = null, fetchDuration = null }) {
  return {
    age,
    ageMinutes: Math.round(age / 60000),
    stale,
    refreshing,
    ...(error && { error }),
    ...(fetchDuration !== null && { fetchDuration }),
  };
}

/**
 * GET /api/rss
 *
 * Returns RSS feed data with stale-while-revalidate caching:
 * - Fresh cache (< 15 min): Return immediately
 * - Stale cache (15-30 min): Return immediately + trigger background refresh
 * - Expired cache (> 30 min): Fetch fresh data (blocking)
 *
 * Query params:
 * - clearCache=true: Force clear the cache and fetch fresh
 */
export async function GET(request) {
  const url = new URL(request.url);
  const forceClear = url.searchParams.get("clearCache") === "true";

  // Rate limiting: max 10 requests per minute per IP
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(`rss-${ip}`, 10)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  // Handle forced cache clear
  if (forceClear) {
    console.log("Cache clear requested via query param");
    await clearCache();
  }

  // Check Netlify Blobs cache
  const cached = await getCachedFeeds();

  if (cached && cached.timestamp && !forceClear) {
    const status = getCacheStatus(cached.timestamp);

    // Fresh cache - return immediately
    if (!status.isStale && !status.isExpired) {
      console.log(`Returning fresh cache (age: ${status.ageMinutes} min)`);
      return NextResponse.json(
        {
          ...cached.data,
          _cache: createCacheMetadata({ age: status.age, stale: false, refreshing: false }),
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=900",
          },
        }
      );
    }

    // Stale but not expired - return stale data + trigger background refresh
    if (status.isStale && !status.isExpired) {
      console.log(`Returning stale cache (age: ${status.ageMinutes} min), triggering background refresh`);

      // Trigger background refresh (fire-and-forget)
      triggerBackgroundRefresh(url.origin);

      return NextResponse.json(
        {
          ...cached.data,
          _cache: createCacheMetadata({ age: status.age, stale: true, refreshing: true }),
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=0, stale-while-revalidate=1800",
            "X-Cache-Status": "STALE",
          },
        }
      );
    }

    // Expired - will fetch fresh below
    console.log(`Cache expired (age: ${status.ageMinutes} min), fetching fresh data`);
  } else if (!cached) {
    console.log("No cache found, fetching fresh data");
  }

  // No valid cache - fetch fresh data (blocking)
  try {
    const startTime = Date.now();
    const freshData = await fetchAllFeeds(15); // Process 15 feeds at a time
    const duration = Date.now() - startTime;

    console.log(`Fresh fetch completed: ${freshData.sources?.length || 0} feeds in ${Math.round(duration / 1000)}s`);

    // Update Netlify Blobs cache
    await setCachedFeeds(freshData);

    return NextResponse.json(
      {
        ...freshData,
        _cache: createCacheMetadata({ age: 0, stale: false, refreshing: false, fetchDuration: duration }),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=900",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching RSS feeds:", error);

    // If we have stale cached data, return it as fallback
    if (cached && cached.data) {
      console.log("Returning stale cache as fallback due to fetch error");
      const age = Date.now() - cached.timestamp;
      return NextResponse.json(
        {
          ...cached.data,
          _cache: createCacheMetadata({
            age,
            stale: true,
            refreshing: false,
            error: "Fresh fetch failed, serving cached data"
          }),
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { sources: [], error: "Failed to fetch RSS feeds" },
      { status: 500 }
    );
  }
}

/**
 * Trigger a background refresh by calling the refresh endpoint
 * This is fire-and-forget - we don't wait for the result
 */
function triggerBackgroundRefresh(origin) {
  const refreshUrl = `${origin}/api/rss/refresh`;

  fetch(refreshUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => {
      if (res.ok) {
        console.log("Background refresh triggered successfully");
      } else {
        console.warn("Background refresh request failed:", res.status);
      }
    })
    .catch((err) => {
      console.error("Failed to trigger background refresh:", err.message);
    });
}
