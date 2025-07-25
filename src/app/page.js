import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { TopBannerAd, SidebarAd, InContentAd } from "@/components/AdBanner";
import UpcomingGamesCarousel from "@/components/UpcomingGamesCarousel";
import { headers } from "next/headers";
import { getCommentCounts, getAllCommentTitles } from "@/utils/supabase";
import HorizontalScroller from "@/components/HorizontalScroller";
import PollCard from "@/components/PollCard";
import BlogCard from "@/components/Blog";



const decodeHtmlEntities = (str) => {
  if (!str) return "";
  if (typeof window === "undefined") return str;
  try {
    const doc = new DOMParser().parseFromString(str, "text/html");
    return doc.documentElement.textContent;
  } catch (error) {
    console.error("Error decoding HTML entities:", error);
    return str;
  }
};

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

function formatDate(dateString) {
  if (!dateString) return "Unknown";
  try {
    return new Date(dateString).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch (e) {
    console.error("Error formatting date:", e);
    return "Unknown";
  }
}

export default async function Home() {
  const sources = await fetchRSS();

  if (!sources || sources.length === 0) {
    return (
      <div>
        <Nav />
        <div className="flex justify-center items-center h-96">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Unable to load news</h2>
            <p>Please try again later or check your internet connection.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  sources.forEach((sourceObj) => {
    if (sourceObj.source.link === "https://www.nbcsports.com/profootballtalk") {
      sourceObj.source.link = "https://www.nbcsports.com/nfl/profootballtalk";
    }
  });

  const regularSources = sources.filter(
    (source) =>
      !source.source.isPodcast &&
      !source.source.isTopChannel &&
      !source.source.isUpAndComing
  );
  const topChannelSources = sources.filter(
    (source) => source.source.isTopChannel
  );
  const podcastSources = sources.filter(
    (source) => source.source.isPodcast && !source.source.isTopChannel
  );
  const upAndComingSources = sources.filter(
    (source) => source.source.isUpAndComing
  );
  const nflYoutubeSource = regularSources.find(
    (s) =>
      s.source.title &&
      s.source.title.toLowerCase().includes("nfl") &&
      s.source.link.includes("youtube")
  );
  const nonNFLYoutubeSources = regularSources.filter(
    (s) => s !== nflYoutubeSource
  );

  {
    /* Featured NFL Video of the Day */
  }
  nonNFLYoutubeSources.splice(1, 0, {
    source: {
      title: "Featured NFL Video",
      link: "https://www.youtube.com/watch?v=GwSzA2niaEM",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/7/75/YouTube_social_white_squircle_(2017).svg",
      updatedAt: "2024-03-31T20:00:00Z",
      isFeatured: true,
    },
    articles: [
      {
        title: "NFL Draft: Top QB Prospects Review",
        link: "https://www.youtube.com/watch?v=GwSzA2niaEM",
        thumbnail: "https://img.youtube.com/vi/GwSzA2niaEM/hqdefault.jpg",
        pubDate: "2024-03-31T20:00:00Z",
      },
    ],
  });
  const topGridSources = nonNFLYoutubeSources.slice(0, 3);
  
  const remainingSources = nonNFLYoutubeSources.slice(3);

  const topGridWithPoll = [...topGridSources];
  

  // Split remaining sources into chunks for better distribution
    const chunkSize = Math.ceil(remainingSources.length / 3);

    const remainingSourcesChunk1 = remainingSources.slice(0, chunkSize);
    const remainingSourcesChunk2 = remainingSources.slice(chunkSize, chunkSize * 2);
    const remainingSourcesChunk3 = remainingSources.slice(chunkSize * 2);

  // Fetch comment counts for displayed articles only (first 6 articles from each source)
  const displayedArticles = [
    ...topGridSources.flatMap(source => (source.articles || []).slice(0, 6)),
    ...remainingSources.flatMap(source => (source.articles || []).slice(0, 6))
    
  ];
  
  const articleTitles = displayedArticles.map(article => article.title).filter(Boolean);
  console.log("Article titles to fetch comments for:", articleTitles.length, "titles");
  console.log("Sample RSS article titles:", articleTitles.slice(0, 3));
  
  // Debug: Get sample titles from database
  const dbTitles = await getAllCommentTitles();
  
  const commentCounts = await getCommentCounts(articleTitles);
  console.log("Comment counts received:", commentCounts);

  const renderCard = ({ source, articles }) => {
    if (source.isFeatured) {
      return (
        <div
          key="featured-nfl-video"
          className="bg-white shadow-lg rounded-lg p-4"
        >
          <div className="flex items-center mb-2">
            <img
              src={source.image}
              alt="YouTube Logo"
              className="w-10 h-10 mr-2"
            />
            <h2 className="text-lg font-bold text-black">Featured NFL Video</h2>
          </div>
          <div className="overflow-hidden group aspect-video mb-2 rounded-lg">
            <a
              href={articles[0].link}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={articles[0].thumbnail}
                alt="Featured NFL Video"
                className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105 group-hover:brightness-90"
              />
            </a>
          </div>

          <p className="text-center mt-2 text-lg font-semibold w-full truncate">
            <a
              href={articles[0].link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-black-600 hover:text-blue-800"
            >
              {decodeHtmlEntities(articles[0]?.title || "Untitled")}
            </a>
          </p>
        </div>
      );
    }

    return (
      <div
        key={source.link || source.title}
        className="bg-white shadow-lg rounded-lg p-4"
      >
        <div className="flex items-center mb-4">
          {source.image && (
            <img
              src={source.image}
              alt={decodeHtmlEntities(source.title || "Unknown Source")}
              className="w-10 h-10 mr-3 rounded-full object-cover"
            />
          )}
          <div>
            <a
              href={source.link || "#"}
              className="text-blue-500 hover:text-blue-700"
              target="_blank"
              rel="noopener noreferrer"
            >
              <h2 className="text-lg font-bold uppercase text-black cursor-pointer">
                {decodeHtmlEntities(source.title || "Unknown Source")}
              </h2>
            </a>
            <p className="text-gray-500 text-xs">
              Last Updated: {formatDate(source.updatedAt)}
            </p>
          </div>
        </div>
        <ul className="space-y-2">
          {articles.slice(0, 6).map((article, index) => {
            const commentCount = commentCounts[article.title] || 0;
            console.log(`Article: "${article.title}" has ${commentCount} comments`);
            return (
              <li key={index} className="border-b pb-2 flex items-start gap-2">
                <div className="flex-1">
                  <a
                    href={article.link || "#"}
                    className="text-black hover:underline hover:text-blue-500 font-medium"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <h3>
                      {decodeHtmlEntities(article.title || "Untitled Article")}
                    </h3>
                  </a>
                  <p className="text-gray-500 text-xs">
                    {formatDate(article.pubDate)}
                  </p>
                </div>
                <div className="relative flex-shrink-0">
                  <a
                    href={`/comments/${article.title}`}
                    className="hover:text-blue-500 relative inline-block"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="36"
                      height="36"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-message-circle"
                    >
                      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                    </svg>
                    {commentCount > 0 && (
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-gray-700 tracking-tight">
                        {commentCount > 99 ? '99+' : commentCount}
                      </span>
                    )}
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
        <a
  href={source.link || "#"}
  className="text-base text-blue-500 mt-2 block font-semibold"
  target="_blank"
  rel="noopener noreferrer"
>
  MORE ...
</a>
      </div>
    );
  };

  return (
    <div className="bg-[#ECCE8B] min-h-screen">
      <Nav />
      
      {/* Top Banner Ad */}
      <div className="px-4 pt-4">
        <TopBannerAd />
      </div>

      {/* Upcoming Games Carousel */}
      <div className="px-4">
        <UpcomingGamesCarousel />
      </div>

      {/* Main Layout with Sidebar */}
      <div className="flex flex-col lg:flex-row gap-6 px-4 pb-4 max-w-screen-2xl mx-auto">
        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {/* Top Grid (ESPN, Featured, ProFootballTalk) - 3 columns on large screens, 2 on medium */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
            {topGridWithPoll.map((source, index) =>
              source.isPollCard ? <PollCard key="poll-card" /> : renderCard(source)
            )}
          </div>

          {/* In-Content Ad */}
          <InContentAd />

          {/* MAIN NFL YOUTUBE CHANNEL CAROUSEL */}
          {regularSources.some(
            (s) => s.source.title === "NFL" && s.source.link.includes("youtube")
          ) && (() => {
            const nflSource = regularSources.find(
              (s) => s.source.title === "NFL" && s.source.link.includes("youtube")
            );
            return (
              <div className="bg-white shadow-lg rounded-lg p-4 mb-6">
                <div className="flex items-center mb-2">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/7/75/YouTube_social_white_squircle_(2017).svg"
                    alt="YouTube Logo"
                    className="w-12 h-12 mr-2"
                  />
                  <div>
                    <h2 className="text-lg font-bold text-black">NFL Latest Videos</h2>
                    <p className="text-gray-500 text-xs">
                      Last Updated: {formatDate(nflSource?.source?.updatedAt)}
                    </p>
                  </div>
                </div>

                <HorizontalScroller videos={nflSource?.articles?.slice(0, 8) || []} />

                <a
                  href="https://www.youtube.com/c/NFL"
                  className="text-lg text-blue-500 block font-semibold"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  MORE ...
                </a>
              </div>
            );
          })()}

          {/* First chunk of remaining articles */}
          {remainingSourcesChunk1.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
              {remainingSourcesChunk1.map((source, index) => {
                // Insert poll card after the first card (index 1)
                if (index === 0) {
                  return (
                    <>
                      {renderCard(source)}
                      <PollCard key="poll-card-middle" />
                    </>
                  );
                }
                return renderCard(source);
              })}
            </div>
          )}

          {/* TOP 10 NFL YOUTUBE CHANNELS (Card Layout) */}
          {topChannelSources.length > 0 && (() => {
            // Prepare the videos array
            const topSourceVideos = topChannelSources
              .map(({ articles }) => articles?.[0])
              .filter(Boolean);

            return (
              <div className="bg-white shadow-lg rounded-lg p-4 mb-6">
                <div className="flex items-center mb-2">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/7/75/YouTube_social_white_squircle_(2017).svg"
                    alt="YouTube Logo"
                    className="w-12 h-12 mr-2"
                  />
                  <div>
                    <h2 className="text-lg font-bold text-black">Top NFL Channels</h2>
                    <p className="text-gray-500 text-xs">
                      Last Updated: {formatDate(topChannelSources[0]?.source?.updatedAt)}
                    </p>
                  </div>
                </div>

                <HorizontalScroller videos={topSourceVideos} />

                <a
                  href="https://www.youtube.com/results?search_query=NFL"
                  className="text-lg text-blue-500 block font-semibold"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  MORE ...
                </a>
              </div>
            );
          })()}


          {/* Second chunk of remaining articles */}
          {remainingSourcesChunk2.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
              {remainingSourcesChunk2.map(renderCard)}
            </div>
          )}

          {/* UP & COMING CHANNELS (Card Layout) */}
          {upAndComingSources.length > 0 && (() => {
            // Prepare the videos array
            const upComingVideos = upAndComingSources
              .map(({ articles }) => articles?.[0])
              .filter(Boolean);

            return (
              <div className="bg-white shadow-lg rounded-lg p-4 mb-6">
                <div className="flex items-center mb-2">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/7/75/YouTube_social_white_squircle_(2017).svg"
                    alt="YouTube Logo"
                    className="w-12 h-12 mr-2"
                  />
                  <div>
                    <h2 className="text-lg font-bold text-black">Up & Coming NFL Channels</h2>
                    <p className="text-gray-500 text-xs">
                      Last Updated: {formatDate(upAndComingSources[0]?.source?.updatedAt)}
                    </p>
                  </div>
                </div>

                <HorizontalScroller videos={upComingVideos} />

                <a
                  href="https://www.youtube.com/results?search_query=nfl+up+and+coming"
                  className="text-lg text-blue-500 block font-semibold"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  MORE ...
                </a>
              </div>
            );
          })()}

          {/* Third chunk of remaining articles */}
          {remainingSourcesChunk3.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
              {remainingSourcesChunk3.map(renderCard)}
              <BlogCard />
            </div>
          )}

          {/* NFL PODCASTS (Card Layout) */}
          {podcastSources.length > 0 && (() => {
            // Flatten and get up to 4 articles from each source
            const podcastVideos = podcastSources.flatMap(({ articles }) => articles?.slice(0, 4) || []);

            return (
              <div className="bg-white shadow-lg rounded-lg p-4 mb-6">
                <div className="flex items-center mb-2">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/7/75/YouTube_social_white_squircle_(2017).svg"
                    alt="YouTube Logo"
                    className="w-12 h-12 mr-2"
                  />
                  <div>
                    <h2 className="text-lg font-bold text-black">NFL Podcasts</h2>
                    <p className="text-gray-500 text-xs">
                      Last Updated: {formatDate(podcastSources[0]?.source?.updatedAt)}
                    </p>
                  </div>
                </div>

                <HorizontalScroller videos={podcastVideos} />

                <a
                  href="https://www.youtube.com/results?search_query=NFL+podcast"
                  className="text-lg text-blue-500 block font-semibold"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  MORE ...
                </a>
              </div>
            );
          })()}
        </div>

        {/* Sidebar - Only visible on large screens */}
        <div className="hidden lg:block w-64 flex-shrink-0 space-y-4">
          <SidebarAd size="medium" />
          <SidebarAd size="large" />
          <SidebarAd size="medium" />
          <SidebarAd size="small" />
        </div>
      </div>

      <Footer />
    </div>
  );
}
