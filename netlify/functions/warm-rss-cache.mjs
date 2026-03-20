/**
 * Netlify Scheduled Function — runs every 5 minutes to keep RSS cache warm.
 * Calls the existing /api/rss/refresh endpoint so all refresh logic stays in one place.
 */
export const config = {
  schedule: "*/5 * * * *",
};

export default async function handler() {
  const baseUrl = (process.env.URL || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");

  if (!baseUrl) {
    console.error("warm-rss-cache: No URL env var set, cannot call refresh endpoint");
    return new Response("Missing URL env var", { status: 500 });
  }

  const refreshUrl = `${baseUrl}/api/rss/refresh`;

  try {
    console.log(`warm-rss-cache: calling ${refreshUrl}`);
    const response = await fetch(refreshUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const body = await response.json();
    console.log(`warm-rss-cache: response ${response.status}`, body);
    return new Response(JSON.stringify(body), { status: response.ok ? 200 : response.status });
  } catch (error) {
    console.error("warm-rss-cache: fetch failed", error.message);
    return new Response(error.message, { status: 500 });
  }
}
