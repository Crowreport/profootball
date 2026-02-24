import Parser from "rss-parser";
import fs from "fs";
import path from "path";

/**
 * Decode HTML entities in a string
 */
export function decodeHtmlEntities(str) {
  if (!str) return "";
  return str.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
}

/**
 * Sanitize malformed XML for RSS parsing
 */
export function sanitizeXml(xmlText) {
  if (!xmlText) return "";

  return xmlText
    .replace(/(<[^>]*\s+)([a-zA-Z0-9_\-]+)(\s*[^=]*?>)/g, '$1$2=""$3')
    .replace(/&(?!(amp;|lt;|gt;|quot;|apos;|#\d+;))/g, "&amp;")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&mdash;/g, "-")
    .replace(/&ndash;/g, "-")
    .replace(/&nbsp;/g, " ");
}

/**
 * Process a single RSS feed
 */
export async function processFeed(feedConfig, parser) {
  const {
    image,
    url: feedUrl,
    isPodcast = false,
    isTopChannel = false,
    isUpAndComing = false,
  } = feedConfig;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(feedUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; NFLNewsReader/1.0)",
          Accept: "application/rss+xml, application/xml, text/xml, */*",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        clearTimeout(timeoutId);
        console.warn(`Skipping feed due to HTTP error: ${feedUrl} (${response.status})`);
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
          console.error(`Failed to parse ${feedUrl} even after sanitizing:`, sanitizeError.message);
          return null;
        }
      }

      const feedTitle = decodeHtmlEntities(parsedFeed.title || "Unknown Feed");
      const feedImage = image || parsedFeed.image?.url || parsedFeed.itunes?.image || null;
      const feedLink = parsedFeed.link?.startsWith("http")
        ? parsedFeed.link
        : parsedFeed.items?.[0]?.link
          ? new URL(parsedFeed.items[0].link).origin
          : feedUrl;

      let feedUpdatedAt = parsedFeed.lastBuildDate || parsedFeed.items?.[0]?.pubDate || null;
      if (feedUpdatedAt) {
        const date = new Date(feedUpdatedAt);
        const now = new Date();
        if (date > now) {
          console.warn(`Feed ${feedUrl} has future date ${feedUpdatedAt}, using current date`);
          feedUpdatedAt = now.toISOString();
        }
      }

      const articles = (parsedFeed.items || [])
        .map((item) => {
          try {
            const articleLink = item.link?.startsWith("http") ? item.link : feedLink;
            if (!articleLink) return null;

            const thumbnail =
              item["media:group"]?.["media:thumbnail"]?.[0]?.["$"]?.url ||
              item["media:thumbnail"]?.url ||
              item.enclosure?.url ||
              item["media:content"]?.url ||
              null;

            let articleDate = item.pubDate || feedUpdatedAt;
            if (articleDate) {
              const date = new Date(articleDate);
              const now = new Date();
              if (date > now) {
                articleDate = now.toISOString();
              }
            }

            return {
              title: decodeHtmlEntities(item.title || "Untitled"),
              link: articleLink,
              thumbnail,
              pubDate: articleDate,
              contentSnippet: decodeHtmlEntities(item.contentSnippet || ""),
            };
          } catch (itemError) {
            console.warn(`Error processing item in feed ${feedUrl}:`, itemError.message);
            return null;
          }
        })
        .filter(Boolean);

      if (articles.length > 0) {
        clearTimeout(timeoutId);
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
      clearTimeout(timeoutId);
      return null;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.warn(`Failed to fetch feed ${feedUrl}:`, fetchError.message);
      return null;
    }
  } catch (feedError) {
    console.error(`Error processing feed ${feedUrl}:`, feedError);
    return null;
  }
}

/**
 * Create a configured RSS parser
 */
export function createParser() {
  return new Parser({
    customFields: {
      feed: ["lastBuildDate"],
      item: [["media:group", "media:group"]],
    },
    timeout: 60000,
    defaultRSS: "2.0",
  });
}

/**
 * Load feed configurations from feeds.json
 */
export function loadFeedConfigs() {
  const filePath = path.join(process.cwd(), "data", "feeds.json");

  try {
    const feeds = JSON.parse(fs.readFileSync(filePath, "utf8")).feeds;
    console.log(`Loaded ${feeds.length} feeds from feeds.json`);

    // Remove duplicates
    const uniqueFeeds = feeds.filter(
      (feed, index, self) => index === self.findIndex((f) => f.url === feed.url)
    );

    console.log(`Processing ${uniqueFeeds.length} unique feeds (removed ${feeds.length - uniqueFeeds.length} duplicates)`);
    return uniqueFeeds;
  } catch (error) {
    console.error("Error loading feeds.json:", error);
    return [];
  }
}

/**
 * Fetch all RSS feeds with batch processing
 * @param {number} batchSize - Number of feeds to process in parallel (default: 15)
 */
export async function fetchAllFeeds(batchSize = 15) {
  const parser = createParser();
  const feeds = loadFeedConfigs();

  if (feeds.length === 0) {
    return { sources: [] };
  }

  const sources = [];
  const startTime = Date.now();

  for (let i = 0; i < feeds.length; i += batchSize) {
    const batch = feeds.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(feeds.length / batchSize);

    console.log(`Processing batch ${batchNum}/${totalBatches} (${batch.length} feeds)`);

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

  const duration = Date.now() - startTime;
  console.log(`Successfully processed ${sources.length} feeds in ${Math.round(duration / 1000)}s`);

  return { sources };
}
