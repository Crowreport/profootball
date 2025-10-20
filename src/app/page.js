"use client";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { TopBannerAd, SidebarAd, InContentAd } from "@/components/AdBanner";
import UpcomingGamesCarousel from "@/components/UpcomingGamesCarousel";
import { getCommentCounts, getAllCommentTitles } from "@/utils/supabase";
import HorizontalScroller from "@/components/HorizontalScroller";
import PollCard from "@/components/PollCard";
import BlogCard from "@/components/Blog";
import ManageSourceModal from "@/components/ManageSourceModal";
import ManageVideoModal from "@/components/ManageVideoModal";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";


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
    // For client-side, use window.location or a simple fallback
    const baseUrl = typeof window !== "undefined" 
      ? `${window.location.protocol}//${window.location.host}`
      : "http://localhost:3000";

    const apiUrl = `${baseUrl}/api/rss`;
    const response = await fetch(apiUrl, {
      cache: "no-store", // Don't cache in client components
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

export default function Home() {
  const { isAdmin } = useAuth();
  const [sources, setSources] = useState([]);
  const [customArticles, setCustomArticles] = useState({});
  const [customVideos, setCustomVideos] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);
  const [selectedVideoSection, setSelectedVideoSection] = useState(null);
  const [editingArticle, setEditingArticle] = useState(null);
  const [editingVideo, setEditingVideo] = useState(null);
  const [commentCounts, setCommentCounts] = useState({});

  // Fetch custom articles
  const fetchCustomArticles = async () => {
    try {
      const response = await fetch('/api/manage-articles');
      if (response.ok) {
        const data = await response.json();
        setCustomArticles(data.articles || {});
      }
    } catch (error) {
      console.error('Error fetching custom articles:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [fetchedSources, customArticlesData, customVideosData] = await Promise.all([
          fetchRSS(),
          fetch('/api/manage-articles').then(res => res.ok ? res.json() : { articles: {} }),
          fetch('/api/manage-videos').then(res => res.ok ? res.json() : { videos: {} })
        ]);
        
        setSources(fetchedSources);
        setCustomArticles(customArticlesData.articles || {});
        setCustomVideos(customVideosData.videos || {});

        // Get comment counts for displayed articles
        const displayedArticles = fetchedSources.flatMap(source => 
          (source.articles || []).slice(0, 6)
        );
        const articleTitles = displayedArticles.map(article => article.title).filter(Boolean);
        
        if (articleTitles.length > 0) {
          const counts = await getCommentCounts(articleTitles);
          setCommentCounts(counts);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // Refresh every 10 minutes
    const interval = setInterval(loadData, 600000);
    return () => clearInterval(interval);
  }, []);

  const handleManageSource = (sourceData) => {
    setSelectedSource(sourceData);
    setEditingArticle(null); // Reset editing article for new article
    setManageModalOpen(true);
  };

  const handleEditArticle = (sourceData, article) => {
    setSelectedSource(sourceData);
    setEditingArticle(article);
    setManageModalOpen(true);
  };

  const handleManageVideo = (sectionType) => {
    setSelectedVideoSection(sectionType);
    setEditingVideo(null);
    setVideoModalOpen(true);
  };

  const handleEditVideo = (sectionType, video) => {
    setSelectedVideoSection(sectionType);
    setEditingVideo(video);
    setVideoModalOpen(true);
  };

  const handleArticleSave = async (result) => {
    // Refresh both sources and custom articles after save
    try {
      const [fetchedSources, customArticlesData] = await Promise.all([
        fetchRSS(),
        fetch('/api/manage-articles').then(res => res.ok ? res.json() : { articles: {} })
      ]);
      
      setSources(fetchedSources);
      setCustomArticles(customArticlesData.articles || {});
      
      console.log('Data refreshed after article save');
      console.log('Custom articles:', customArticlesData.articles);
    } catch (error) {
      console.error('Error refreshing data after article save:', error);
    }
  };

  const handleVideoSave = async (result) => {
    // Refresh custom videos after save
    try {
      const customVideosData = await fetch('/api/manage-videos').then(res => res.ok ? res.json() : { videos: {} });
      setCustomVideos(customVideosData.videos || {});
      
      console.log('Videos refreshed after video save');
      console.log('Custom videos:', customVideosData.videos);
    } catch (error) {
      console.error('Error refreshing videos after save:', error);
    }
  };

  const handleModalClose = () => {
    setManageModalOpen(false);
    setSelectedSource(null);
    setEditingArticle(null);
  };

  const handleVideoModalClose = () => {
    setVideoModalOpen(false);
    setSelectedVideoSection(null);
    setEditingVideo(null);
  };

  // Merge custom videos with YouTube sections
  const mergeCustomVideos = (sectionType, originalVideos) => {
    const customSectionVideos = customVideos[sectionType] || [];
    
    console.log(`Merging videos for section: ${sectionType}`);
    console.log(`Original videos: ${originalVideos.length}`);
    console.log(`Custom videos: ${customSectionVideos.length}`);
    
    // Combine custom videos first, then original videos
    const mergedVideos = [
      ...customSectionVideos,
      ...originalVideos
    ];
    
    console.log(`Total merged videos: ${mergedVideos.length}`);
    return mergedVideos;
  };

  // Merge custom articles with RSS articles for each source
  const mergeSourceArticles = (source) => {
    const rssArticles = source.articles || [];
    const sourceUrl = source.url || source.source?.url || source.link || source.source?.link;
    const customSourceArticles = customArticles[sourceUrl] || [];
    
    console.log(`Merging articles for source: ${source.title || 'Unknown'}`);
    console.log(`Source URL: ${sourceUrl}`);
    console.log(`RSS articles: ${rssArticles.length}`);
    console.log(`Custom articles: ${customSourceArticles.length}`);
    
    // Combine and sort by date (custom articles first, then RSS)
    const mergedArticles = [
      ...customSourceArticles,
      ...rssArticles
    ];
    
    console.log(`Total merged articles: ${mergedArticles.length}`);
    
    return {
      ...source,
      articles: mergedArticles
    };
  };

  if (loading && !sources.length) {
    return (
      <div className="bg-[#ECCE8B] min-h-screen">
        <Nav />
        <div className="flex justify-center items-center h-96">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Loading news...</h2>
            <p>Please wait while we fetch the latest news.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#ECCE8B] min-h-screen">
        <Nav />
        <div className="flex justify-center items-center h-96">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Error loading news</h2>
            <p>Failed to load news. Please try again later.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

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

  // 🚫 Feeds to only show in bottom section
const bottomOnlyFeeds = ["USA Today NFL", "The Sporting News NFL", "The Ringer", "FANSIDED", "Sports Illustrated NFL", "The Draft Network", "NFL Spin Zone", "Bleacher Report", "Fox Sports", "AtoZ Sports", "Substack", "NFL News",];

// Make a version of sources that excludes bottom-only feeds for main/top sections
// Make a version of sources that excludes bottom-only feeds for main/top sections
const mainPageSources = sources.filter(
  (source) =>
    !bottomOnlyFeeds.some(name =>
      source.source.title?.toLowerCase() === name.toLowerCase() ||
      source.source.title?.toLowerCase().includes(name.toLowerCase())
    )
);
  
const regularSources = mainPageSources.filter(
  (source) =>
    !source.source.isPodcast &&
    !source.source.isTopChannel &&
    !source.source.isUpAndComing
);
const topChannelSources = mainPageSources.filter(
  (source) => source.source.isTopChannel
);
const podcastSources = mainPageSources.filter(
  (source) => source.source.isPodcast && !source.source.isTopChannel
);
const upAndComingSources = mainPageSources.filter(
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

  const renderCard = ({ source, articles }) => {
    // Merge custom and RSS articles
    const mergedSource = mergeSourceArticles({ source, articles });
    const displayArticles = mergedSource.articles;

    console.log(`Rendering card for: ${source.title || 'Unknown'}`);
    console.log(`Display articles count: ${displayArticles.length}`);
    console.log(`First few articles:`, displayArticles.slice(0, 3).map(a => ({ title: a.title, isCustom: a.isCustom })));

    if (source.isFeatured) {
      // Merge custom videos with the default featured video for this section
      const defaultVideo = displayArticles[0];
      const customFeaturedVideos = customVideos['featured-nfl-video'] || [];
      
      // Combine custom videos with default, then take first 3
      const allFeaturedVideos = [...customFeaturedVideos, defaultVideo].filter(Boolean);
      const featuredVideos = allFeaturedVideos.slice(0, 3); // Show up to 3 videos

      return (
        <div
          key="featured-nfl-video"
          className="bg-white shadow-lg rounded-lg p-4 h-full flex flex-col"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <img
                src={source.image}
                alt="YouTube Logo"
                className="w-10 h-10 mr-2"
              />
              <h2 className="text-lg font-bold text-black">Featured NFL Video</h2>
            </div>
            {isAdmin() && (
              <button
                onClick={() => handleManageVideo('featured-nfl-video')}
                className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
              >
                Add Video
              </button>
            )}
          </div>

          {/* Vertical scrolling container for up to 3 featured videos */}
          {featuredVideos.length > 0 ? (
            <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <div className="space-y-3 pr-2">
                {featuredVideos.map((video, index) => (
                  <div key={index}>
                    <div className="relative overflow-hidden group aspect-video rounded-lg">
                      <a
                        href={video?.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={video?.thumbnail}
                          alt={video?.title || "Featured NFL Video"}
                          className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105 group-hover:brightness-90"
                        />
                      </a>
                      
                      {/* Edit button for custom featured video */}
                      {video?.isCustom && isAdmin() && (
                        <button
                          onClick={() => handleEditVideo('featured-nfl-video', video)}
                          className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 text-xs rounded hover:bg-yellow-600 transition-colors"
                          title="Edit featured video"
                        >
                          Edit
                        </button>
                      )}
                      
                      {/* Custom badge for featured video */}
                      {video?.isCustom && (
                        <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 text-xs rounded">
                          Custom
                        </div>
                      )}
                    </div>

                    <p className="text-center mt-2 text-lg font-semibold w-full truncate">
                      <a
                        href={video?.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-black-600 hover:text-blue-800"
                      >
                        {decodeHtmlEntities(video?.title || "Untitled")}
                      </a>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Show placeholder if no videos */
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-2">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-gray-300 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">No featured videos available</p>
                {isAdmin() && (
                  <p className="text-gray-400 text-xs mt-1">Click &quot;Add Video&quot; to set featured content</p>
                )}
              </div>
            </div>
          )}
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
              href={`/external/${encodeURIComponent(source.link || "#")}`}
              className="text-blue-500 hover:text-blue-700"
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
          {displayArticles.slice(0, 6).map((article, index) => {
            const commentCount = commentCounts[article.title] || 0;
            return (
              <li key={index} className="border-b pb-2 flex items-start gap-2">
                <div className="flex-1">
                  <a
                    href={`/external/${encodeURIComponent(article.link || "#")}`}
                    className="text-black hover:underline hover:text-blue-500 font-medium"
                  >
                    <h3 className="flex items-center gap-2">
                      {decodeHtmlEntities(article.title || "Untitled Article")}
                      {article.isCustom && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Custom
                        </span>
                      )}
                    </h3>
                  </a>
                  <p className="text-gray-500 text-xs">
                    {formatDate(article.pubDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Edit button for custom articles (admin only) */}
                  {article.isCustom && isAdmin() && (
                    <button
                      onClick={() => handleEditArticle(source, article)}
                      className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 transition-colors"
                      title="Edit custom article"
                    >
                      Edit
                    </button>
                  )}
                  {/* Comment count */}
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
                </div>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center justify-between mt-2">
          <a
            href={source.link || "#"}
            className="text-base text-blue-500 font-semibold"
            target="_blank"
            rel="noopener noreferrer"
          >
            MORE ...
          </a>
          {isAdmin() && (
            <button
              onClick={() => handleManageSource(source)}
              className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
            >
              Add Article
            </button>
          )}
        </div>
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
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_256px] gap-6 px-4 pb-4 max-w-screen-2xl mx-auto">
        {/* Main Content Area */}
        <div className="min-w-0">
          {/* --- NEW TOP GRID LAYOUT --- */}
          {/* Top grid: Card 1 | Featured NFL Video | Card 2 */}
          {topGridSources.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 items-stretch">
              {/* Card 1 */}
              <div className="h-full flex flex-col">
                {renderCard(topGridSources.filter(source => !source.source.isFeatured)[0])}
              </div>
              {/* Featured NFL Video */}
              <div className="h-full flex flex-col">
                {renderCard(topGridSources.find(source => source.source.isFeatured))}
              </div>
              {/* Card 2 */}
              <div className="h-full flex flex-col">
                {renderCard(topGridSources.filter(source => !source.source.isFeatured)[1])}
              </div>
            </div>
          )}


          {/* In-Content Ad */}
          <InContentAd />

          {/* MAIN NFL YOUTUBE CHANNEL CAROUSEL */}
          {regularSources.some(
            (s) => s.source.title === "NFL" && s.source.link.includes("youtube")
          ) && (() => {
            const nflSource = regularSources.find(
              (s) => s.source.title === "NFL" && s.source.link.includes("youtube")
            );
            
            // Merge custom videos with original NFL videos
            const originalVideos = nflSource?.articles?.slice(0, 8) || [];
            const mergedVideos = mergeCustomVideos('nfl-latest-videos', originalVideos);
            
            return (
              <div className="bg-white shadow-lg rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
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
                  {isAdmin() && (
                    <button
                      onClick={() => handleManageVideo('nfl-latest-videos')}
                      className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
                    >
                      Add Video
                    </button>
                  )}
                </div>

                <HorizontalScroller videos={mergedVideos} onEditVideo={isAdmin() ? (video) => handleEditVideo('nfl-latest-videos', video) : null} />

                <a
                  href="https://www.youtube.com/c/NFL"
                  className="text-lg text-blue-500 block font-semibold"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  
                </a>
              </div>
            );
          })()}

{remainingSourcesChunk1.length > 0 && (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
    {remainingSourcesChunk1
      .filter(source => !source.source?.title?.toLowerCase().includes("sportsnet"))
      .map((source, idx) => {
        if (idx === 1) {
          return [<BlogCard key="blog-card-in-grid" />, renderCard(source)];
        }
        return renderCard(source);
      })}

    {/* ✅ Poll Card */}
    <div className="bg-white shadow-lg rounded-lg p-4 flex items-center justify-center text-gray-500 text-lg font-semibold h-full">
      <PollCard />
    </div>
    
    {/* Blank Card - Visible but empty */}
    <div className="bg-white shadow-lg rounded-lg p-4 h-full">
      {/* Empty space - maintains grid layout */}
    </div>
  </div>
)}


          {/* TOP 20 NFL YOUTUBE CHANNELS (Card Layout) */}
          {topChannelSources.length > 0 && (() => {
            // Prepare the videos array
            const topSourceVideos = topChannelSources
              .map(({ articles }) => articles?.[0])
              .filter(Boolean);

            // Merge custom videos with original top channel videos
            const mergedTopVideos = mergeCustomVideos('top-nfl-channels', topSourceVideos);

            return (
              <div className="bg-white shadow-lg rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
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
                  {isAdmin() && (
                    <button
                      onClick={() => handleManageVideo('top-nfl-channels')}
                      className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
                    >
                      Add Video
                    </button>
                  )}
                </div>

                <HorizontalScroller videos={mergedTopVideos} onEditVideo={isAdmin() ? (video) => handleEditVideo('top-nfl-channels', video) : null} />

                <a
                  href="https://www.youtube.com/results?search_query=NFL"
                  className="text-lg text-blue-500 block font-semibold"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  
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

            // Merge custom videos with original up & coming videos
            const mergedUpComingVideos = mergeCustomVideos('up-coming-channels', upComingVideos);

            return (
              <div className="bg-white shadow-lg rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
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
                  {isAdmin() && (
                    <button
                      onClick={() => handleManageVideo('up-coming-channels')}
                      className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
                    >
                      Add Video
                    </button>
                  )}
                </div>

                <HorizontalScroller videos={mergedUpComingVideos} onEditVideo={isAdmin() ? (video) => handleEditVideo('up-coming-channels', video) : null} />

                <a
                  href="https://www.youtube.com/results?search_query=nfl+up+and+coming"
                  className="text-lg text-blue-500 block font-semibold"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  
                </a>
              </div>
            );
          })()}

{/* Third chunk of remaining articles */}
{remainingSourcesChunk3.length > 0 && (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
    {remainingSourcesChunk3.map((source) => (
      <div
        key={source.source.link || source.source.title}
        className="bg-white shadow-lg rounded-lg p-4"
      >
        <div className="flex items-center mb-4">
          {source.source.image && (
            <img
              src={source.source.image}
              alt={decodeHtmlEntities(source.source.title || "Unknown Source")}
              className="w-10 h-10 mr-3 rounded-full object-cover"
            />
          )}
          <div>
            <a
              href={`/external/${encodeURIComponent(source.source.link || "#")}`}
              className="text-blue-500 hover:text-blue-700"
            >
              <h2 className="text-lg font-bold uppercase text-black cursor-pointer">
                {decodeHtmlEntities(source.source.title || "Unknown Source")}
              </h2>
            </a>
            <p className="text-gray-500 text-xs">
              Last Updated: {formatDate(source.source.updatedAt)}
            </p>
          </div>
        </div>
        <ul className="space-y-2">
          {source.articles.slice(0, 5).map((article, index) => {  {/* Changed from 6 to 4 */}
            const commentCount = commentCounts[article.title] || 0;
            return (
              <li key={index} className="border-b pb-2 flex items-start gap-2">
                <div className="flex-1">
                  <a
                    href={`/external/${encodeURIComponent(article.link || "#")}`}
                    className="text-black hover:underline hover:text-blue-500 font-medium"
                  >
                    <h3 className="flex items-center gap-2">
                      {decodeHtmlEntities(article.title || "Untitled Article")}
                      {article.isCustom && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Custom
                        </span>
                      )}
                    </h3>
                  </a>
                  <p className="text-gray-500 text-xs">
                    {formatDate(article.pubDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Edit button for custom articles (admin only) */}
                  {article.isCustom && isAdmin() && (
                    <button
                      onClick={() => handleEditArticle(source.source, article)}
                      className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 transition-colors"
                      title="Edit custom article"
                    >
                      Edit
                    </button>
                  )}
                  {/* Comment count */}
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
                </div>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center justify-between mt-2">
          <a
            href={`/external/${encodeURIComponent(source.source.link || "#")}`}
            className="text-base text-blue-500 font-semibold"
          >
            MORE ...
          </a>
          {isAdmin() && (
            <button
              onClick={() => handleManageSource(source.source)}
              className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
            >
              Add Article
            </button>
          )}
        </div>
      </div>
    ))}
  </div>
)}


          {/* NFL PODCASTS (Card Layout) */}
          {podcastSources.length > 0 && (() => {
            // Flatten and get up to 4 articles from each source
            const podcastVideos = podcastSources.flatMap(({ articles }) => articles?.slice(0, 4) || []);

            // Merge custom videos with original podcast videos
            const mergedPodcastVideos = mergeCustomVideos('nfl-podcasts', podcastVideos);

            return (
              <div className="bg-white shadow-lg rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
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
                  {isAdmin() && (
                    <button
                      onClick={() => handleManageVideo('nfl-podcasts')}
                      className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
                    >
                      Add Video
                    </button>
                  )}
                </div>

                <HorizontalScroller videos={mergedPodcastVideos} onEditVideo={isAdmin() ? (video) => handleEditVideo('nfl-podcasts', video) : null} />

                <a
                  href="https://www.youtube.com/results?search_query=NFL+podcast"
                  className="text-lg text-blue-500 block font-semibold"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  
                </a>
              </div>
            );
          })()}

{/* First 3 RSS Cards */}
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
  {[
    "Substack",
    "The Sporting News NFL",
    "The Ringer",
  ].map((sourceName, i) => {
    const matchedSource = sources.find( 
      (s) => s.source?.title && s.source.title.toLowerCase().includes(sourceName.toLowerCase())
    ) || { 
      source: { 
        title: sourceName, 
        link: "#", 
        image: null, 
        updatedAt: null 
      }, 
      articles: [] 
    };

    // Process articles (limit to 6)
    const validArticles = (matchedSource.articles || [])
      .filter(article => article?.title && article?.link)
      .slice(0, 6);

    return (
      <div
        key={`rss-card-first-${i}`}
        className="bg-white shadow-lg rounded-lg p-4 h-full flex flex-col"
      >
        <div className="flex items-center mb-4">
          {matchedSource.source.image ? (
            <img
              src={matchedSource.source.image}
              alt={matchedSource.source.title}
              className="w-10 h-10 mr-3 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 mr-3 bg-gray-300 rounded-full" />
          )}
          <div>
            <a
              href={`/external/${encodeURIComponent(matchedSource.source.link)}`}
              className="text-blue-500 hover:text-blue-700"
            >
              <h2 className="text-lg font-bold uppercase text-black cursor-pointer">
                {decodeHtmlEntities(matchedSource.source.title)}
              </h2>
            </a>
            <p className="text-gray-500 text-xs">
              Last Updated: {matchedSource.source.updatedAt ? formatDate(matchedSource.source.updatedAt) : "--"}
            </p>
          </div>
        </div>
        
        <ul className="space-y-2 flex-1">
          {validArticles.length > 0 ? (
            validArticles.map((article, index) => {
              const commentCount = commentCounts[article.title] || 0;
              return (
                <li key={index} className="border-b pb-2 flex items-start gap-2">
                  <div className="flex-1">
                    <a
                      href={`/external/${encodeURIComponent(article.link)}`}
                      className="text-black hover:underline hover:text-blue-500 font-medium"
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
                      href={`/comments/${encodeURIComponent(article.title)}`}
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
            })
          ) : (
            <li className="border-b pb-2 flex items-start gap-2">
              <div className="flex-1">
                <p className="text-gray-400">No articles found</p>
              </div>
            </li>
          )}
        </ul>

        <div className="flex items-center justify-between mt-2">
          <a
            href={`/external/${encodeURIComponent(matchedSource.source.link)}`}
            className="text-base text-blue-500 font-semibold"
          >
            MORE ...
          </a>
          {isAdmin() && (
            <button
              onClick={() => handleManageSource(matchedSource.source)}
              className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
            >
              Add Article
            </button>
          )}
        </div>
      </div>
    );
  })}
</div>

{/* APPLE PODCASTS - Final Production Version */}
{(() => {
  // Create Apple podcast entries that match your data structure
  const applePodcastEntries = [
    {
      source: {
        title: "The Athletic Football Show",
        link: "https://podcasts.apple.com/us/podcast/the-athletic-football-show-a-show-about-the-nfl/id1528622068",
        image: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts211/v4/a9/a5/a5/a9a5a548-aaa2-2449-a377-58b667a1f791/mza_11148697896506461332.jpg/600x600bb.webp",
        updatedAt: new Date().toISOString(),
        isPodcast: true,
        platform: "apple",
        category: "nfl",
        isTopChannel: false,
        isUpAndComing: false
      },
      articles: []
    },
    {
      source: {
        title: "The Ringer NFL Show",
        link: "https://podcasts.apple.com/us/podcast/the-ringer-nfl-show/id1109282822",
        image: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts211/v4/5a/48/6a/5a486adf-73e6-26b9-b561-f6e2873c572f/mza_1785770566387105059.jpg/600x600bb.webp",
        updatedAt: new Date().toISOString(),
        isPodcast: true,
        platform: "apple",
        category: "nfl",
        isTopChannel: false,
        isUpAndComing: false
      },
      articles: []
    },
    {
      source: {
        title: "Between Two Tackles",
        link: "https://podcasts.apple.com/us/podcast/between-two-tackles-an-nfl-draft-podcast/id1609106186",
        image: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts116/v4/24/54/8d/24548d8c-5394-7358-f5d8-9ff07f201609/mza_1444539383299393638.jpg/600x600bb.webp",
        updatedAt: new Date().toISOString(),
        isPodcast: true,
        platform: "apple",
        category: "nfl",
        isTopChannel: false,
        isUpAndComing: false
      },
      articles: []
    },
    {
      source: {
        title: "NFL: Move the Sticks with Daniel Jeremiah & Bucky Brooks",
        link: "https://podcasts.apple.com/us/podcast/nfl-move-the-sticks-with-daniel-jeremiah-bucky-brooks/id915544088",
        image: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts122/v4/6c/b3/a9/6cb3a936-96b4-8678-2b00-7e49ebfd5f67/mza_7055624270899931142.jpg/600x600bb.webp",
        updatedAt: new Date().toISOString(),
        isPodcast: true,
        platform: "apple",
        category: "nfl",
        isTopChannel: false,
        isUpAndComing: false
      },
      articles: []
    },
    {
      source: {
        title: "Pushing the Pile: A CBS Sports NFL Podcast",
        link: "https://podcasts.apple.com/us/podcast/pushing-the-pile-a-cbs-sports-nfl-podcast/id1263289980",
        image: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts211/v4/68/ca/20/68ca20b0-5f3e-65cd-16ff-1d56dd8260ab/mza_6144371241567306810.jpeg/600x600bb.webp",
        updatedAt: new Date().toISOString(),
        isPodcast: true,
        platform: "apple",
        category: "nfl",
        isTopChannel: false,
        isUpAndComing: false
      },
      articles: []
    },
    {
      source: {
        title: "NFL Daily with Gregg Rosenthal",
        link: "https://podcasts.apple.com/us/podcast/nfl-daily-with-gregg-rosenthal/id680904259",
        image: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts211/v4/3b/84/cb/3b84cbb6-fdca-013c-c0d9-1c8df4e18d0f/mza_1265160913721821659.jpg/600x600bb.webp",
        updatedAt: new Date().toISOString(),
        isPodcast: true,
        platform: "apple",
        category: "nfl",
        isTopChannel: false,
        isUpAndComing: false
      },
      articles: []
    },
    {
      source: {
        title: "The PFF NFL Podcast",
        link: "https://podcasts.apple.com/us/podcast/the-pff-nfl-podcast/id913714358",
        image: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/8f/38/f9/8f38f9d7-e9c8-96ca-cbb9-a93e459f11ac/mza_11081555557747608023.jpg/600x600bb.webp",
        updatedAt: new Date().toISOString(),
        isPodcast: true,
        platform: "apple",
        category: "nfl",
        isTopChannel: false,
        isUpAndComing: false
      },
      articles: []
    },
    {
      source: {
        title: "Locked On NFL",
        link: "https://podcasts.apple.com/us/podcast/locked-on-nfl-daily-podcast-on-the-national-football-league/id1139967050",
        image: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts112/v4/01/40/2c/01402cd3-e2e8-23af-d158-6fb78e07744a/mza_15840960386776504347.jpg/600x600bb.webp",
        updatedAt: new Date().toISOString(),
        isPodcast: true,
        platform: "apple",
        category: "nfl",
        isTopChannel: false,
        isUpAndComing: false
      },
      articles: []
    },
    {
      source: {
        title: "NFL: The Insiders",
        link: "https://podcasts.apple.com/us/podcast/nfl-the-insiders/id1543090622",
        image: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/42/1a/c7/421ac770-5d22-405b-a035-eb563e6a3c59/mza_16470200703550842608.jpg/600x600bb.webp",
        updatedAt: new Date().toISOString(),
        isPodcast: true,
        platform: "apple",
        category: "nfl",
        isTopChannel: false,
        isUpAndComing: false
      },
      articles: []
    },
    {
      source: {
        title: "Ross Tucker Football Podcast: Daily NFL Podcast",
        link: "https://podcasts.apple.com/us/podcast/ross-tucker-football-podcast-daily-nfl-podcast/id638447093",
        image: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts211/v4/ce/59/94/ce5994a8-26c8-e904-62a9-6508a60146c8/mza_7171840262594070795.jpg/600x600bb.webp",
        updatedAt: new Date().toISOString(),
        isPodcast: true,
        platform: "apple",
        category: "nfl",
        isTopChannel: false,
        isUpAndComing: false
      },
      articles: []
    },
    {
      source: {
        title: "NFL Live",
        link: "https://podcasts.apple.com/us/podcast/nfl-live/id1042028608",
        image: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts112/v4/57/d8/96/57d896c2-9706-f02c-6b49-f335d0571b31/mza_5627380360837065018.jpg/600x600bb.webp",
        updatedAt: new Date().toISOString(),
        isPodcast: true,
        platform: "apple",
        category: "nfl",
        isTopChannel: false,
        isUpAndComing: false
      },
      articles: []
    },
    {
      source: {
        title: "The MMQB NFL Podcast",
        link: "https://podcasts.apple.com/us/podcast/the-mmqb-nfl-podcast/id916244917",
        image: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/16/40/ab/1640abad-a909-561e-e21f-86bfd5b4e52c/mza_8919883195966963473.jpg/600x600bb.webp",
        updatedAt: new Date().toISOString(),
        isPodcast: true,
        platform: "apple",
        category: "nfl",
        isTopChannel: false,
        isUpAndComing: false
      },
      articles: []
    },
    {
      source: {
        title: "The NFL on FOX Podcast",
        link: "https://podcasts.apple.com/us/podcast/the-nfl-on-fox-podcast/id1705559962",
        image: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts211/v4/e8/0e/84/e80e8444-8d96-dc14-ae8b-f5ab1c7ec077/mza_10204594845247928203.jpeg/600x600bb.webp",
        updatedAt: new Date().toISOString(),
        isPodcast: true,
        platform: "apple",
        category: "nfl",
        isTopChannel: false,
        isUpAndComing: false
      },
      articles: []
    }
  ];
  
  // Combine with existing sources
  const sourcesWithApplePodcasts = [...(sources || []), ...applePodcastEntries];
  
  // Filter for Apple podcasts
  const applePodcastSources = sourcesWithApplePodcasts.filter(source => 
    source.source?.isPodcast === true && source.source?.platform === "apple"
  ) || [];
  
  if (applePodcastSources.length === 0) {
    return null;
  }
  
  // Transform data for HorizontalScroller
  const podcastAsVideos = applePodcastSources.map((podcast) => ({
    title: podcast.source?.title || 'Untitled Podcast',
    thumbnail: podcast.source?.image || 'https://placehold.co/400x400?text=No+Image',
    link: podcast.source?.link || '#',
    duration: 'Podcast',
    date: podcast.source?.category ? podcast.source.category.toUpperCase() : 'NFL'
  }));

  // Merge custom videos with original podcast videos for Apple Podcasts
  const mergedApplePodcastVideos = mergeCustomVideos('apple-podcasts', podcastAsVideos);

  return (
    <div className="bg-white shadow-lg rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Podcasts_%28iOS%29.svg"
            alt="Apple Podcasts Logo"
            className="w-12 h-12 mr-3"
          />
          <div>
            <h2 className="text-lg font-bold text-black">Apple Podcasts</h2>
            <p className="text-gray-500 text-xs">
              NFL Podcasts ({applePodcastSources.length} available)
            </p>
          </div>
        </div>
        {isAdmin() && (
          <button
            onClick={() => handleManageVideo('apple-podcasts')}
            className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
          >
            Add Video
          </button>
        )}
      </div>

      <HorizontalScroller videos={mergedApplePodcastVideos} onEditVideo={isAdmin() ? (video) => handleEditVideo('apple-podcasts', video) : null} />

      <a
        href="https://podcasts.apple.com/us/genre/podcasts-sports/id1545"
        className="text-blue-500 hover:text-blue-700 font-medium text-sm mt-4 inline-block"
        target="_blank"
        rel="noopener noreferrer"
      >
        View More Sports Podcasts on Apple Podcasts →
      </a>
    </div>
  );
})()}

{/* Second 3 RSS Cards */}
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
  {[
    "FANSIDED",
    "Sports Illustrated NFL",
    "The Draft Network",
  ].map((sourceName, i) => {
    const matchedSource = sources.find( 
      (s) => s.source?.title && s.source.title.toLowerCase().includes(sourceName.toLowerCase())
    ) || { 
      source: { 
        title: sourceName, 
        link: "#", 
        image: null, 
        updatedAt: null 
      }, 
      articles: [] 
    };

    // Process articles (limit to 6)
    const validArticles = (matchedSource.articles || [])
      .filter(article => article?.title && article?.link)
      .slice(0, 6);

    return (
      <div
        key={`rss-card-second-${i}`}
        className="bg-white shadow-lg rounded-lg p-4 h-full flex flex-col"
      >
        <div className="flex items-center mb-4">
          {matchedSource.source.image ? (
            <img
              src={matchedSource.source.image}
              alt={matchedSource.source.title}
              className="w-10 h-10 mr-3 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 mr-3 bg-gray-300 rounded-full" />
          )}
          <div>
            <a
              href={`/external/${encodeURIComponent(matchedSource.source.link)}`}
              className="text-blue-500 hover:text-blue-700"
            >
              <h2 className="text-lg font-bold uppercase text-black cursor-pointer">
                {decodeHtmlEntities(matchedSource.source.title)}
              </h2>
            </a>
            <p className="text-gray-500 text-xs">
              Last Updated: {matchedSource.source.updatedAt ? formatDate(matchedSource.source.updatedAt) : "--"}
            </p>
          </div>
        </div>
        
        <ul className="space-y-2 flex-1">
          {validArticles.length > 0 ? (
            validArticles.map((article, index) => {
              const commentCount = commentCounts[article.title] || 0;
              return (
                <li key={index} className="border-b pb-2 flex items-start gap-2">
                  <div className="flex-1">
                    <a
                      href={`/external/${encodeURIComponent(article.link)}`}
                      className="text-black hover:underline hover:text-blue-500 font-medium"
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
                      href={`/comments/${encodeURIComponent(article.title)}`}
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
            })
          ) : (
            <li className="border-b pb-2 flex items-start gap-2">
              <div className="flex-1">
                <p className="text-gray-400">No articles found</p>
              </div>
            </li>
          )}
        </ul>

        <div className="flex items-center justify-between mt-2">
          <a
            href={`/external/${encodeURIComponent(matchedSource.source.link)}`}
            className="text-base text-blue-500 font-semibold"
          >
            MORE ...
          </a>
          {isAdmin() && (
            <button
              onClick={() => handleManageSource(matchedSource.source)}
              className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
            >
              Add Article
            </button>
          )}
        </div>
      </div>
    );
  })}
</div>

{/* Last 3 RSS Cards */}
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
  {[
    "NFL Spin Zone",
    "Bleacher Report",
    "Fox Sports",
  ].map((sourceName, i) => {
    const matchedSource = sources.find( 
      (s) => s.source?.title && s.source.title.toLowerCase().includes(sourceName.toLowerCase())
    ) || { 
      source: { 
        title: sourceName, 
        link: "#", 
        image: null, 
        updatedAt: null 
      }, 
      articles: [] 
    };

    // Process articles (limit to 6)
    const validArticles = (matchedSource.articles || [])
      .filter(article => article?.title && article?.link)
      .slice(0, 6);

    return (
      <div
        key={`rss-card-third-${i}`}
        className="bg-white shadow-lg rounded-lg p-4 h-full flex flex-col"
      >
        <div className="flex items-center mb-4">
          {matchedSource.source.image ? (
            <img
              src={matchedSource.source.image}
              alt={matchedSource.source.title}
              className="w-10 h-10 mr-3 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 mr-3 bg-gray-300 rounded-full" />
          )}
          <div>
            <a
              href={`/external/${encodeURIComponent(matchedSource.source.link)}`}
              className="text-blue-500 hover:text-blue-700"
            >
              <h2 className="text-lg font-bold uppercase text-black cursor-pointer">
                {decodeHtmlEntities(matchedSource.source.title)}
              </h2>
            </a>
            <p className="text-gray-500 text-xs">
              Last Updated: {matchedSource.source.updatedAt ? formatDate(matchedSource.source.updatedAt) : "--"}
            </p>
          </div>
        </div>
        
        <ul className="space-y-2 flex-1">
          {validArticles.length > 0 ? (
            validArticles.map((article, index) => {
              const commentCount = commentCounts[article.title] || 0;
              return (
                <li key={index} className="border-b pb-2 flex items-start gap-2">
                  <div className="flex-1">
                    <a
                      href={`/external/${encodeURIComponent(article.link)}`}
                      className="text-black hover:underline hover:text-blue-500 font-medium"
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
                      href={`/comments/${encodeURIComponent(article.title)}`}
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
            })
          ) : (
            <li className="border-b pb-2 flex items-start gap-2">
              <div className="flex-1">
                <p className="text-gray-400">No articles found</p>
              </div>
            </li>
          )}
        </ul>

        <div className="flex items-center justify-between mt-2">
          <a
            href={`/external/${encodeURIComponent(matchedSource.source.link)}`}
            className="text-base text-blue-500 font-semibold"
          >
            MORE ...
          </a>
          {isAdmin() && (
            <button
              onClick={() => handleManageSource(matchedSource.source)}
              className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
            >
              Add Article
            </button>
          )}
        </div>
      </div>
    );
  })}
</div>

        </div>

        {/* Sidebar - Only visible on large screens */}
        <div className="hidden lg:block w-64 flex-shrink-0 space-y-8">
          <SidebarAd size="medium" />
          <SidebarAd size="large" />
          <SidebarAd size="medium" />
          <SidebarAd size="small" />
        </div>
      </div>

      <Footer />

      {isAdmin() && (
        <ManageSourceModal
          isOpen={manageModalOpen}
          onClose={handleModalClose}
          sourceData={selectedSource}
          onSave={handleArticleSave}
          editingArticle={editingArticle}
        />
      )}

      {isAdmin() && (
        <ManageVideoModal
          isOpen={videoModalOpen}
          onClose={handleVideoModalClose}
          sectionType={selectedVideoSection}
          editingVideo={editingVideo}
          onSave={handleVideoSave}
        />
      )}
    </div>
  );
}