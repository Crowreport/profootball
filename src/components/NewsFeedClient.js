"use client";
import { useState, useEffect } from "react";
import ManageUserArticlesModal from "./ManageUserArticlesModal";
import ManageFeaturedVideoModal from "./ManageFeaturedVideoModal";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { TopBannerAd, SidebarAd, InContentAd } from "@/components/AdBanner";
import UpcomingGamesCarousel from "@/components/UpcomingGamesCarousel";

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

export default function NewsFeedClient({ sources, commentCounts }) {
  const [modalState, setModalState] = useState({ isOpen: false, source: null, article: null });
  const [userArticles, setUserArticles] = useState({});
  const [featuredVideos, setFeaturedVideos] = useState([]);
  const [isFeaturedVideoModalOpen, setIsFeaturedVideoModalOpen] = useState(false);
  const [editingFeaturedVideo, setEditingFeaturedVideo] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const userArticlesRes = await fetch("/api/user-articles");
      if (userArticlesRes.ok) {
        const data = await userArticlesRes.json();
        setUserArticles(data);
      }
      const featuredVideoRes = await fetch("/api/featured-video");
      if (featuredVideoRes.ok) {
        const data = await featuredVideoRes.json();
        setFeaturedVideos(data || []);
      }
    }
    fetchData();
  }, []);

  const handleUserArticleAdded = (sourceLink, newArticle) => {
    setUserArticles((prev) => ({
      ...prev,
      [sourceLink]: [...(prev[sourceLink] || []), newArticle],
    }));
  };

  const handleUserArticleUpdated = (sourceLink, updatedArticle) => {
    setUserArticles((prev) => ({
      ...prev,
      [sourceLink]: (prev[sourceLink] || []).map(a => a.id === updatedArticle.id ? updatedArticle : a),
    }));
  };

  const handleUserArticleDeleted = (sourceLink, articleId) => {
    setUserArticles((prev) => ({
      ...prev,
      [sourceLink]: (prev[sourceLink] || []).filter(a => a.id !== articleId),
    }));
  };

  const handleFeaturedVideoAdded = (newVideo) => {
    setFeaturedVideos(prev => [...prev, newVideo]);
  };

  const handleFeaturedVideoUpdated = (updatedVideo) => {
    setFeaturedVideos(prev => prev.map(v => v.id === updatedVideo.id ? updatedVideo : v));
  };

  const handleFeaturedVideoDeleted = async (videoId) => {
    if (!confirm("Are you sure you want to delete this featured video?")) return;
    const res = await fetch("/api/featured-video", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: videoId }),
    });
    if (res.ok) {
      setFeaturedVideos(prev => prev.filter(v => v.id !== videoId));
    } else {
      alert("Failed to delete featured video.");
    }
  };

  const openModal = (source, article = null) => setModalState({ isOpen: true, source, article });
  const closeModal = () => setModalState({ isOpen: false, source: null, article: null });

  const openFeaturedVideoModal = (video = null) => {
    setEditingFeaturedVideo(video);
    setIsFeaturedVideoModalOpen(true);
  }

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

  const topGridSources = [...nonNFLYoutubeSources.slice(0, 1)];
  const remainingSources = nonNFLYoutubeSources.slice(1);

  const renderFeaturedVideoCard = (video) => (
    <div key={video.id} className="bg-white shadow-lg rounded-lg p-4">
      <div className="flex items-center mb-2">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/7/75/YouTube_social_white_squircle_(2017).svg"
          alt="YouTube Logo"
          className="w-10 h-10 mr-2"
        />
        <h2 className="text-lg font-bold text-black">Featured NFL Video</h2>
      </div>
      <div className="overflow-hidden group aspect-video mb-2 rounded-lg">
        <a href={video.link} target="_blank" rel="noopener noreferrer">
          <img
            src={video.thumbnail}
            alt="Featured NFL Video"
            className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105 group-hover:brightness-90"
          />
        </a>
      </div>
      <p className="text-center mt-2 text-lg font-semibold w-full truncate">
        <a href={video.link} target="_blank" rel="noopener noreferrer" className="text-black-600 hover:text-blue-800">
          {decodeHtmlEntities(video.title || "Untitled")}
        </a>
      </p>
      <div className="flex gap-2 mt-2">
        <button onClick={() => openFeaturedVideoModal(video)} className="text-sm text-blue-500 hover:underline">Edit</button>
        <button onClick={() => handleFeaturedVideoDeleted(video.id)} className="text-sm text-red-500 hover:underline">Delete</button>
      </div>
    </div>
  );

  const renderAddFeaturedVideoCard = () => (
    <div className="bg-white shadow-lg rounded-lg p-4 flex items-center justify-center">
      <button onClick={() => openFeaturedVideoModal()} className="text-lg font-bold text-blue-500 hover:underline">
        + Add Featured Video
      </button>
    </div>
  );

  const renderCard = ({ source, articles }) => {
    const mergedArticles = [
      ...(userArticles[source.link] || []),
      ...articles.slice(0, 6),
    ];

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
          {mergedArticles.map((article, index) => {
            const commentCount = commentCounts?.[article.title] || 0;
            const isUserArticle = !!article.id;

            const handleDelete = async () => {
              if (!confirm("Are you sure you want to delete this article?")) return;
              const res = await fetch("/api/user-articles", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: article.id }),
              });
              if (res.ok) {
                handleUserArticleDeleted(source.link, article.id);
              } else {
                alert("Failed to delete article.");
              }
            };

            return (
              <li key={article.id || index} className="border-b pb-2 flex items-start gap-2">
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
                {isUserArticle && (
                  <div className="flex flex-col gap-1">
                    <button onClick={() => openModal(source, article)} className="text-xs text-blue-500 hover:underline">Edit</button>
                    <button onClick={handleDelete} className="text-xs text-red-500 hover:underline">Delete</button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <div className="flex gap-2 mt-2">
          <a
            href={source.link || "#"}
            className="text-sm text-blue-500 font-semibold"
            target="_blank"
            rel="noopener noreferrer"
          >
            MORE ...
          </a>
          <button
            className="text-sm text-green-600 font-semibold underline"
            onClick={() => openModal(source)}
            type="button"
          >
            Manage Content
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <Nav />
      <div className="px-4 pt-4">
        <TopBannerAd />
      </div>
      <div className="px-4">
        <UpcomingGamesCarousel />
      </div>
      <div className="flex flex-col lg:flex-row gap-6 px-4 pb-4 max-w-screen-2xl mx-auto">
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
            {topGridSources.map(renderCard)}
            {featuredVideos.map(renderFeaturedVideoCard)}
            {featuredVideos.length < 3 && renderAddFeaturedVideoCard()}
          </div>
          <InContentAd />
          {regularSources.some(
            (s) => s.source.title === "NFL" && s.source.link.includes("youtube")
          ) && (
            <div className="bg-white shadow-lg rounded-lg p-4 mb-6">
              <div className="flex items-center mb-2">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/7/75/YouTube_social_white_squircle_(2017).svg"
                  alt="YouTube Logo"
                  className="w-12 h-12 mr-2"
                />
                <div>
                  <h2 className="text-lg font-bold text-black">
                    NFL Latest Videos
                  </h2>
                  <p className="text-gray-500 text-xs">
                    Last Updated: {formatDate(
                      regularSources.find(
                        (s) =>
                          s.source.title === "NFL" &&
                          s.source.link.includes("youtube")
                      )?.source?.updatedAt
                    )}
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto whitespace-nowrap flex gap-4 mb-4">
                {(
                  regularSources.find(
                    (s) =>
                      s.source.title === "NFL" && s.source.link.includes("youtube")
                  )?.articles || []
                )
                  .slice(0, 8)
                  .map((video, index) => (
                    <a
                      key={index}
                      href={video.link || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block min-w-[200px] max-w-[220px] flex-shrink-0"
                    >
                      <div className="w-full rounded-lg overflow-hidden group aspect-video">
                        {video.thumbnail ? (
                          <img
                            src={video.thumbnail}
                            alt={decodeHtmlEntities(
                              video.title || "Untitled Video"
                            )}
                            className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105 group-hover:-translate-y-1 group-hover:brightness-80 group-hover:shadow-lg"
                          />
                        ) : (
                          <div className="bg-gray-200 h-40 w-full flex items-center justify-center">
                            <p className="text-center px-3 text-sm font-semibold truncate">
                              {decodeHtmlEntities(video.title || "Untitled Video")}
                            </p>
                          </div>
                        )}
                      </div>
                      <p className="text-center mt-2 text-sm font-semibold w-full truncate">
                        {decodeHtmlEntities(video.title || "Untitled Video")}
                      </p>
                    </a>
                  ))}
              </div>
              <a
                href="https://www.youtube.com/c/NFL"
                className="text-sm text-blue-500 block font-semibold"
                target="_blank"
                rel="noopener noreferrer"
              >
                MORE ...
              </a>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
            {remainingSources.map(renderCard)}
          </div>
          {topChannelSources.length > 0 && (
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
              <div className="overflow-x-auto whitespace-nowrap flex gap-4 mb-4">
                {topChannelSources
                  .map(({ articles }) => articles?.[0])
                  .filter(Boolean)
                  .map((video, index) => (
                    <a
                      key={index}
                      href={video.link || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block min-w-[200px] max-w-[220px] flex-shrink-0"
                    >
                      <div className="w-full rounded-lg overflow-hidden group aspect-video">
                        {video.thumbnail ? (
                          <img
                            src={video.thumbnail}
                            alt={decodeHtmlEntities(
                              video.title || "Untitled Video"
                            )}
                            className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105 group-hover:-translate-y-1 group-hover:brightness-80 group-hover:shadow-lg"
                          />
                        ) : (
                          <div className="bg-gray-200 h-40 w-full flex items-center justify-center">
                            <p className="text-center px-3 text-sm font-semibold truncate">
                              {decodeHtmlEntities(video.title || "Untitled Video")}
                            </p>
                          </div>
                        )}
                      </div>
                      <p className="text-center mt-2 text-sm font-semibold w-full truncate">
                        {decodeHtmlEntities(video.title || "Untitled Video")}
                      </p>
                    </a>
                  ))}
              </div>
              <a
                href="https://www.youtube.com/results?search_query=NFL"
                className="text-sm text-blue-500 block font-semibold"
                target="_blank"
                rel="noopener noreferrer"
              >
                MORE ...
              </a>
            </div>
          )}
          {upAndComingSources.length > 0 && (
            <div className="bg-white shadow-lg rounded-lg p-4 mb-6">
              <div className="flex items-center mb-2">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/7/75/YouTube_social_white_squircle_(2017).svg"
                  alt="YouTube Logo"
                  className="w-12 h-12 mr-2"
                />
                <div>
                  <h2 className="text-lg font-bold text-black">
                    Up & Coming NFL Channels
                  </h2>
                  <p className="text-gray-500 text-xs">
                    Last Updated: {formatDate(upAndComingSources[0]?.source?.updatedAt)}
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto whitespace-nowrap flex gap-4 mb-4">
                {upAndComingSources
                  .map(({ articles }) => articles?.[0])
                  .filter(Boolean)
                  .map((video, index) => (
                    <a
                      key={index}
                      href={video.link || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block min-w-[200px] max-w-[220px] flex-shrink-0"
                    >
                      <div className="w-full rounded-lg overflow-hidden group aspect-video">
                        {video.thumbnail ? (
                          <img
                            src={video.thumbnail}
                            alt={decodeHtmlEntities(
                              video.title || "Untitled Video"
                            )}
                            className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105 group-hover:-translate-y-1 group-hover:brightness-80 group-hover:shadow-lg"
                          />
                        ) : (
                          <div className="bg-gray-200 h-40 w-full flex items-center justify-center">
                            <p className="text-center px-3 text-sm font-semibold truncate">
                              {decodeHtmlEntities(video.title || "Untitled Video")}
                            </p>
                          </div>
                        )}
                      </div>
                      <p className="text-center mt-2 text-sm font-semibold w-full truncate">
                        {decodeHtmlEntities(video.title || "Untitled Video")}
                      </p>
                    </a>
                  ))}
              </div>
              <a
                href="https://www.youtube.com/results?search_query=nfl+up+and+coming"
                className="text-sm text-blue-500 block font-semibold"
                target="_blank"
                rel="noopener noreferrer"
              >
                MORE ...
              </a>
            </div>
          )}
          {podcastSources.length > 0 && (
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
              <div className="overflow-x-auto whitespace-nowrap flex gap-4 mb-4">
                {podcastSources
                  .flatMap(({ articles }) => articles?.slice(0, 4) || [])
                  .map((video, index) => (
                    <a
                      key={index}
                      href={video.link || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block min-w-[200px] max-w-[220px] flex-shrink-0"
                    >
                      <div className="w-full rounded-lg overflow-hidden group aspect-video">
                        {video.thumbnail ? (
                          <img
                            src={video.thumbnail}
                            alt={decodeHtmlEntities(
                              video.title || "Untitled Video"
                            )}
                            className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105 group-hover:-translate-y-1 group-hover:brightness-80 group-hover:shadow-lg"
                          />
                        ) : (
                          <div className="bg-gray-200 h-40 w-full flex items-center justify-center">
                            <p className="text-center px-3 text-sm font-semibold truncate">
                              {decodeHtmlEntities(video.title || "Untitled Video")}
                            </p>
                          </div>
                        )}
                      </div>
                      <p className="text-center mt-2 text-sm font-semibold w-full truncate">
                        {decodeHtmlEntities(video.title || "Untitled Video")}
                      </p>
                    </a>
                  ))}
              </div>
              <a
                href="https://www.youtube.com/results?search_query=NFL+podcast"
                className="text-sm text-blue-500 block font-semibold"
                target="_blank"
                rel="noopener noreferrer"
              >
                MORE ...
              </a>
            </div>
          )}
        </div>
        <div className="hidden lg:block w-64 flex-shrink-0 space-y-4">
          <SidebarAd size="medium" />
          <SidebarAd size="large" />
          <SidebarAd size="medium" />
          <SidebarAd size="small" />
        </div>
      </div>
      <Footer />
      <ManageUserArticlesModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        source={modalState.source}
        article={modalState.article}
        onArticleAdded={handleUserArticleAdded}
        onArticleUpdated={handleUserArticleUpdated}
      />
      <ManageFeaturedVideoModal
        isOpen={isFeaturedVideoModalOpen}
        onClose={() => setIsFeaturedVideoModalOpen(false)}
        video={editingFeaturedVideo}
        onVideoAdded={handleFeaturedVideoAdded}
        onVideoUpdated={handleFeaturedVideoUpdated}
      />
    </div>
  );
}
