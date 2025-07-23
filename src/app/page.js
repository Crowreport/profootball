import NewsFeedClient from "@/components/NewsFeedClient";
import { headers } from "next/headers";
import { getCommentCounts, getAllCommentTitles } from "@/utils/supabase";

async function fetchRSS() {
  try {
    // Await headers() as required in Next.js 15
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";

    const apiUrl = `${protocol}://${host}/api/rss`;
    // Remove conflicting cache options
    const response = await fetch(apiUrl, {
      next: { revalidate: 600 },
    });

    if (!response.ok) {
      console.error("RSS API returned error:", response.status);
      return [];
    }

    const data = await response.json();
    return data.sources || [];
  } catch (error) {
    console.error("Error fetching RSS data:", error);
    return [];
  }
}

export default async function Home() {
  const sources = await fetchRSS();

  if (!sources || sources.length === 0) {
    return <div>Unable to load news. Please try again later.</div>;
  }

  // Prepare commentCounts for all articles (first 6 per source)
  const displayedArticles = sources.flatMap(sourceObj => (sourceObj.articles || []).slice(0, 6));
  const articleTitles = displayedArticles.map(article => article.title).filter(Boolean);
  const commentCounts = await getCommentCounts(articleTitles);

  return <NewsFeedClient sources={sources} commentCounts={commentCounts} />;
}
