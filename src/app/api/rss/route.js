import { NextResponse } from "next/server";
import Parser from "rss-parser";
import fs from "fs";
import path from "path";
import { checkRateLimit } from "@/utils/ratelimit";

// In-memory cache for RSS feeds
let cache = {
  data: null,
  timestamp: null,
  ttl: 5 * 60 * 1000, // 5 minutes cache
};

const decodeHtmlEntities = (str) => {
  if (!str) return "";
  return str.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
};

const sanitizeXml = (xmlText) => {
  if (!xmlText) return "";

  return (
    xmlText
      // Fix attributes without values (e.g., <tag attr> to <tag attr="">)
      .replace(/(<[^>]*\s+)([a-zA-Z0-9_\-]+)(\s*[^=]*?>)/g, '$1$2=""$3')
      // Fix unescaped ampersands not part of entities
      .replace(/&(?!(amp;|lt;|gt;|quot;|apos;|#\d+;))/g, "&amp;")
      // Fix HTML entities that aren't valid in XML
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"')
      .replace(/&lsquo;/g, "'")
      .replace(/&rsquo;/g, "'")
      .replace(/&mdash;/g, "-")
      .replace(/&ndash;/g, "-")
      .replace(/&nbsp;/g, " ")
  );
};

// Process a single feed
async function processFeed(feedConfig, parser) {
  const {
    image,
    url: feedUrl,
    isPodcast = false,
    isTopChannel = false,
    isUpAndComing = false,
  } = feedConfig;

  try {
    console.log(`Fetching feed: ${feedUrl}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // Reduced to 10 seconds

    try {
      const response = await fetch(feedUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; NFLNewsReader/1.0)",
          Accept: "application/rss+xml, application/xml, text/xml, */*",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(
          `Skipping feed due to HTTP error: ${feedUrl} (${response.status})`
        );
        return null;
      }

      let xmlText = await response.text();
      let parsedFeed;

      try {
        parsedFeed = await parser.parseString(xmlText);
      } catch (parseError) {
        console.warn(`Error parsing feed ${feedUrl}: ${parseError.message}`);
        try {
          const sanitizedXml = sanitizeXml(xmlText);
          parsedFeed = await parser.parseString(sanitizedXml);
          console.log(`Successfully parsed ${feedUrl} after sanitization`);
        } catch (sanitizeError) {
          console.error(
            `Failed to parse ${feedUrl} even after sanitizing:`,
            sanitizeError.message
          );
          return null;
        }
      }

      const feedTitle = decodeHtmlEntities(parsedFeed.title || "Unknown Feed");
      const feedImage =
        image || parsedFeed.image?.url || parsedFeed.itunes?.image || null;
      const feedLink = parsedFeed.link?.startsWith("http")
        ? parsedFeed.link
        : parsedFeed.items?.[0]?.link
        ? new URL(parsedFeed.items[0].link).origin
        : feedUrl;
      const feedUpdatedAt =
        parsedFeed.lastBuildDate || parsedFeed.items?.[0]?.pubDate || null;

      const articles = (parsedFeed.items || [])
        .map((item) => {
          try {
            const articleLink = item.link?.startsWith("http")
              ? item.link
              : feedLink;
            if (!articleLink) return null;

            const thumbnail =
              item["media:group"]?.["media:thumbnail"]?.[0]?.["$"]?.url ||
              item["media:thumbnail"]?.url ||
              item.enclosure?.url ||
              item["media:content"]?.url ||
              null;

            return {
              title: decodeHtmlEntities(item.title || "Untitled"),
              link: articleLink,
              thumbnail,
              pubDate: item.pubDate || feedUpdatedAt,
              contentSnippet: decodeHtmlEntities(item.contentSnippet || ""),
            };
          } catch (itemError) {
            console.warn(
              `Error processing item in feed ${feedUrl}:`,
              itemError.message
            );
            return null;
          }
        })
        .filter(Boolean);

      if (articles.length > 0) {
        return {
          source: {
            title: feedTitle,
            link: feedLink,
            image: feedImage,
            updatedAt: feedUpdatedAt,
            isPodcast,
            isTopChannel,
            isUpAndComing,
          },
          articles,
        };
      }

      console.log(`No articles found in feed: ${feedUrl}`);
      return null;
    } catch (fetchError) {
      console.warn(`Failed to fetch feed ${feedUrl}:`, fetchError.message);
      return null;
    }
  } catch (feedError) {
    console.error(`Error processing feed ${feedUrl}:`, feedError);
    return null;
  }
}

export async function GET(request) {
  // Rate limiting: max 10 requests per minute per IP
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(`rss-${ip}`, 10)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  // Check cache first
  if (
    cache.data &&
    cache.timestamp &&
    Date.now() - cache.timestamp < cache.ttl
  ) {
    console.log("Returning cached RSS data");
    return NextResponse.json(cache.data);
  }

  const parser = new Parser({
    customFields: {
      feed: ["lastBuildDate"],
      item: [["media:group", "media:group"]],
    },
    timeout: 60000,
    defaultRSS: "2.0",
  });

  const filePath = path.join(process.cwd(), "data", "feeds.json");

  let feeds;
  try {
    feeds = JSON.parse(fs.readFileSync(filePath, "utf8")).feeds;
    console.log(`Loaded ${feeds.length} feeds from feeds.json`);
  } catch (error) {
    console.error("Error loading feeds.json:", error);
    return NextResponse.json({ sources: [] }, { status: 200 });
  }

  // Remove duplicate feed URL
  const uniqueFeeds = feeds.filter(
    (feed, index, self) => index === self.findIndex((f) => f.url === feed.url)
  );

  console.log(
    `Processing ${uniqueFeeds.length} unique feeds (removed ${
      feeds.length - uniqueFeeds.length
    } duplicates)`
  );

  // Process feeds in parallel with batching to avoid overwhelming the system
  const BATCH_SIZE = 10;
  const sources = [];

  for (let i = 0; i < uniqueFeeds.length; i += BATCH_SIZE) {
    const batch = uniqueFeeds.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map((feed) => processFeed(feed, parser));

    const batchResults = await Promise.allSettled(batchPromises);

    batchResults.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value) {
        sources.push(result.value);
      } else if (result.status === "rejected") {
        console.error(`Feed ${batch[index].url} failed:`, result.reason);
      }
    });
  }

  console.log(`Successfully processed ${sources.length} feeds`);

  console.log(sources.map(s => s.source.title));

  // Update cache
  const responseData = { sources };
  cache.data = responseData;
  cache.timestamp = Date.now();

  return NextResponse.json(responseData);
}
