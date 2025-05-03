"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import Link from "next/link";

export default function Comments({ articleId, sourceTitle }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Format the date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString();
  };

  // Check for user
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const currentUser = data.session?.user || null;
        setUser(currentUser);

        // If user is logged in, get their profile
        if (currentUser) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", currentUser.id)
            .single();

          setUserProfile(profileData);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    getUser();

    const authListener = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      // Re-fetch profile if auth state changes
      if (session?.user) {
        supabase
          .from("profiles")
          .select("username")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => {
            setUserProfile(data);
          });
      } else {
        setUserProfile(null);
      }
    });

    return () => {
      authListener.data.subscription.unsubscribe();
    };
  }, []);

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);

        // First, get comments with user IDs
        const { data: commentsData, error: commentsError } = await supabase
          .from("comments")
          .select("id, content, created_at, user_id")
          .eq("article_id", articleId)
          .order("created_at", { ascending: false });

        if (commentsError) {
          console.error("Error fetching comments:", commentsError);
          return;
        }

        // Fetch all profiles in one query to improve performance
        const userIds = [
          ...new Set(commentsData.map((comment) => comment.user_id)),
        ];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", userIds);

        // Create a profiles lookup map for faster access
        const profilesMap = {};
        if (profilesData) {
          profilesData.forEach((profile) => {
            profilesMap[profile.id] = profile.username;
          });
        }

        // Map the comments with usernames
        const commentsWithUsernames = commentsData.map((comment) => {
          const isCurrentUser = comment.user_id === user?.id;
          const username = profilesMap[comment.user_id];

          return {
            ...comment,
            username: username || (isCurrentUser ? "You" : "Some User"),
            isCurrentUser,
          };
        });

        setComments(commentsWithUsernames || []);
      } catch (err) {
        console.error("Error in fetchComments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel("comments")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `article_id=eq.${articleId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [articleId, user, userProfile]);

  // Submit a new comment
  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("You must be signed in to comment");
      return;
    }

    if (!newComment.trim()) {
      return;
    }

    try {
      const { error } = await supabase.from("comments").insert({
        article_id: articleId,
        user_id: user.id,
        content: newComment.trim(),
      });

      if (error) {
        console.error("Error submitting comment:", error);
        return;
      }

      // Clear the input
      setNewComment("");
    } catch (err) {
      console.error("Error in handleSubmitComment:", err);
    }
  };

  return (
    <div className="border-t pt-4 mt-4">
      <h3 className="font-bold mb-2">Comments</h3>

      {/* Comment form */}
      {user ? (
        <form onSubmit={handleSubmitComment} className="mb-4">
          <div className="mb-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write your comment..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows="2"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-[#0B0B12] text-white py-1 px-3 rounded-md hover:bg-[#23232d]"
          >
            Post
          </button>
        </form>
      ) : (
        <div className="bg-gray-100 p-2 rounded-md mb-4">
          <p className="text-center text-sm">
            <Link href="/auth/signin" className="text-blue-500 hover:underline">
              Sign in
            </Link>{" "}
            to comment
          </p>
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <p className="text-center text-gray-500 text-sm">Loading comments...</p>
      ) : comments.length > 0 ? (
        <ul className="space-y-2">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className={`border-b pb-2 ${
                comment.isCurrentUser ? "bg-blue-50 rounded-md p-2" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                {comment.isCurrentUser ? (
                  <p className="font-medium text-sm text-blue-600">You</p>
                ) : (
                  <Link
                    href={`/profile/${comment.user_id}`}
                    className="font-medium text-sm hover:underline hover:text-blue-500"
                  >
                    {comment.username}
                  </Link>
                )}
                <p className="text-gray-500 text-xs">
                  {formatDate(comment.created_at)}
                </p>
              </div>
              <p className="text-sm mt-1">{comment.content}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500 text-sm">No comments yet</p>
      )}
    </div>
  );
}
