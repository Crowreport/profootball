"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import DOMPurify from "isomorphic-dompurify";
import Image from "next/image";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createClient } from "@/utils/supabase/component";
import { useUserStore } from "@/store/useUserStore";
import { censorText } from "@/utils/censor";
import { decodeHtmlEntities } from "@/utils/decodeHtmlEntities";
import { checkRateLimit } from "@/utils/ratelimit";

// Dynamically import TinyMCE Editor for SSR compatibility
const Editor = dynamic(
  () => import("@tinymce/tinymce-react").then((mod) => mod.Editor),
  { ssr: false }
);

interface Comment {
  comment_id: string;
  user_id: string;
  newsletter_title: string;
  content: string;
  votes_up: number;
  votes_down: number;
  created_at: string;
  users?: {
    first_name?: string;
    last_name?: string;
  };
}

interface CommentsPageProps {
  title: string;
  sourceTitle?: string;
  sourceImage?: string;
  sourceLink?: string;
}

const getStoredVotes = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem('commentVotes') || '{}');
  } catch {
    return {};
  }
};

const setStoredVotes = (votes: Record<string, string>): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('commentVotes', JSON.stringify(votes));
};

export default function CommentsPage({ title, sourceTitle, sourceImage, sourceLink }: CommentsPageProps) {
  const { profile, isAuthenticated } = useUserStore();
  const supabase = createClient();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentContent, setCommentContent] = useState("");
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const decodedTitle = decodeURIComponent(title);

  useEffect(() => {
    setUserVotes(getStoredVotes());
  }, []);

  // Fetch comments from Supabase when component mounts or title changes
  useEffect(() => {
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from("comments")
        .select(
          `
          *,
          users (
            first_name,
            last_name
          )
        `
        )
        .eq("newsletter_title", decodedTitle)
        .order("created_at", { ascending: true });

      console.log("Fetched Comments:", data);

      if (error) {
        console.error("Error fetching comments:", error);
      } else {
        setComments(data || []);
      }
    };

    fetchComments();

    // Setup real-time listener for new comments
    const commentsChannel = supabase
      .channel("comments_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `newsletter_title=eq.${decodedTitle}`,
        },
        (payload) => {
          console.log("Change received!", payload);
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      commentsChannel.unsubscribe();
    };
  }, [decodedTitle, supabase]);

  const handleLogin = async (): Promise<boolean> => {
    if (email.trim() === "") {
      alert("Please enter an email.");
      return false;
    }
    if (password.trim() === "") {
      alert("Please enter a password.");
      return false;
    }

    setIsLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      alert("Login failed: " + error.message);
      setIsLoading(false);
      return false;
    }

    if (!data.user) {
      alert("User not found after login. Please try again.");
      setIsLoading(false);
      return false;
    }

    // Note: The profile will be updated by the app's auth flow
    // For now, we'll just clear the login form
    if (!rememberMe) {
      setEmail("");
      setPassword("");
    }

    setIsLoading(false);
    return true;
  };

  const handleSubmit = async () => {
    if (
      commentContent.trim() === "" ||
      commentContent === "<p><br></p>" ||
      commentContent === "<p></p>"
    ) {
      return alert("Please enter a comment.");
    }

    // Rate limiting: max 5 comments per minute
    const userIp = 'client-' + (profile?.id || 'anonymous');
    if (!checkRateLimit(userIp, 5)) {
      return alert("Too many comments. Please wait a moment (max 5 per minute).");
    }

    // Handle authentication if not logged in
    if (!isAuthenticated || !profile) {
      const loginSuccess = await handleLogin();
      if (!loginSuccess) {
        return;
      }
      
      // We need to wait for the profile to be set, but for now we'll use a different approach
      alert("Please try submitting your comment again after logging in.");
      return;
    }

    // Censor the comment content before saving
    const plainText = decodeHtmlEntities(commentContent.replace(/<[^>]+>/g, ' '));
    const censoredContent = censorText(plainText);

    const newCommentPayload = {
      user_id: profile.id,
      newsletter_title: decodedTitle,
      content: censoredContent,
    };

    setIsLoading(true);

    // Insert new comment into Supabase
    const { data, error } = await supabase
      .from("comments")
      .insert([newCommentPayload])
      .select(
        `
        *,
        users (
          first_name,
          last_name
        )
      `
      );

    setIsLoading(false);

    if (error) {
      alert("Error adding comment: " + error.message);
      console.error(error);
    } else {
      // Optimistically add the new comment to the state for instant feedback
      if (data && data[0]) {
        setComments((prevComments) => [...prevComments, data[0]]);
      }
      setCommentContent("");
    }
  };

  const handleVote = async (index: number, type: 'up' | 'down') => {
    const comment = comments[index];
    const votes = getStoredVotes();
    const prevVote = votes[comment.comment_id];
    
    if (prevVote === type) {
      return;
    }
    
    const updatedVotes = { ...votes, [comment.comment_id]: type };
    setStoredVotes(updatedVotes);
    setUserVotes(updatedVotes);

    // Calculate vote changes
    let votes_up = comment.votes_up;
    let votes_down = comment.votes_down;
    
    if (!prevVote) {
      if (type === 'up') votes_up++;
      else votes_down++;
    } else {
      if (type === 'up') {
        votes_up++;
        votes_down--;
      } else {
        votes_down++;
        votes_up--;
      }
    }

    // Update votes in Supabase
    const { data, error } = await supabase
      .from('comments')
      .update({ votes_up, votes_down })
      .eq('comment_id', comment.comment_id)
      .select();

    if (error) {
      alert('Error updating vote: ' + error.message);
      console.error(error);
    } else if (data && data[0]) {
      const updatedCommentData = {
        ...data[0],
        users: comment.users,
      };
      setComments((prevComments) =>
        prevComments.map((c) =>
          c.comment_id === updatedCommentData.comment_id ? updatedCommentData : c
        )
      );
    }
  };

  return (
    <div>
      <Nav />
      <div className="max-w-4xl mx-auto mt-10 p-4 mb-50 rounded shadow bg-gray-100">
        {/* Source Information */}
        {sourceTitle && (
          <div className="flex items-center mb-4 p-3 bg-white rounded-lg border">
            {sourceImage && (
              <Image
                src={decodeURIComponent(sourceImage)}
                alt={decodeURIComponent(sourceTitle)}
                width={40}
                height={40}
                className="mr-3 rounded-full object-cover"
              />
            )}
            <div>
              <h4 className="font-semibold text-gray-700">Source:</h4>
              {sourceLink ? (
                <a
                  href={`/external/${encodeURIComponent(sourceLink)}`}
                  className="text-blue-500 hover:text-blue-700 font-medium"
                >
                  {decodeURIComponent(sourceTitle)}
                </a>
              ) : (
                <span className="text-gray-600">{decodeURIComponent(sourceTitle)}</span>
              )}
            </div>
          </div>
        )}

        {/* Title */}
        <h3 className="text-2xl font-bold mb-4">
          Article: {decodeURIComponent(title)}
        </h3>

        {/* Comments List */}
        <section className="mb-6">
          <h4 className="text-lg font-semibold mb-2">Comments</h4>
          {comments.length > 0 ? (
            <ul className="border p-2 rounded bg-gray-50">
              {comments.map((c, index) => (
                <li key={c.comment_id} className="border-b p-2 last:border-0">
                  <div className="flex frontusername justify-between items-center bg-[#f5da9f] border">
                    <div className="ml-5 font-bold">
                      {c.users?.first_name} {c.users?.last_name}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleVote(index, "up")}
                        className={`text-green-500 ${userVotes[c.comment_id] === 'up' ? 'font-bold' : ''}`}
                        type="button"
                        disabled={userVotes[c.comment_id] === 'up'}
                      >
                        👍 ({c.votes_up ?? 0})
                      </button>
                      <button
                        onClick={() => handleVote(index, "down")}
                        className={`text-red-500 ${userVotes[c.comment_id] === 'down' ? 'font-bold' : ''}`}
                        type="button"
                        disabled={userVotes[c.comment_id] === 'down'}
                      >
                        👎 ({c.votes_down ?? 0})
                      </button>
                      <span className="text-xs pr-5 text-gray-500">
                        {new Date(c.created_at).toLocaleString("en-US", {
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                          hour: "numeric",
                          minute: "numeric",
                          second: "numeric",
                          hour12: true,
                        })}
                      </span>
                    </div>
                  </div>
                  <div
                    className="mt-2"
                    dangerouslySetInnerHTML={{ 
                      __html: DOMPurify.sanitize(c.content, {
                        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'span', 'div'],
                        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style'],
                        ALLOW_DATA_ATTR: false
                      }) 
                    }}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No comments yet.</p>
          )}
        </section>

        {/* Login and Comment Section */}
        {!isAuthenticated ? (
          <form
            onSubmit={(e) => e.preventDefault()}
            className="space-y-4 border border-black p-4 rounded bg-gray-50"
          >
            <div className="flex flex-wrap items-center space-x-4 mb-4">
              <label className="font-bold">Email:</label>
              <input
                type="email"
                placeholder="Email"
                className="border border-black px-2 py-1 rounded flex-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              <label className="font-bold ml-4">Password:</label>
              <input
                type="password"
                placeholder="Password"
                className="border border-black px-2 py-1 rounded flex-1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <a
                href="/forgot-password"
                className="text-blue-500 text-sm ml-2 hover:underline"
              >
                Forgot password?
              </a>
            </div>

            <div className="mb-4">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              <label htmlFor="rememberMe" className="ml-2">
                Remember me
              </label>
              <div className="mt-2">
                <a
                  href="/signup"
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Create an account to make comments
                </a>
              </div>
            </div>

            <div className="border border-gray-300 rounded p-2 bg-white">
              <Editor
                apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                value={commentContent}
                init={{
                  height: 200,
                  menubar: false,
                  plugins: ["image", "link", "lists", "media", "table"],
                  toolbar:
                    "undo redo | fontfamily fontsize formatselect fontselect fontsizeselect | bold italic underline | alignleft aligncenter alignright | bullist numlist | link image media",
                  font_family_formats:
                    "Arial=arial,helvetica,sans-serif; Courier New=courier new,courier; Times New Roman=times new roman,times; Verdana=verdana,geneva;",
                  fontsize_formats: "10px 12px 14px 16px 18px 24px 36px",
                  file_picker_types: "image media",
                  images_upload_handler: (blobInfo: any) => {
                    return new Promise((resolve, reject) => {
                      try {
                        const base64 = blobInfo.base64();
                        const mimeType = blobInfo.blob().type;
                        const dataUrl = `data:${mimeType};base64,${base64}`;
                        resolve(dataUrl);
                      } catch (err) {
                        reject("Failed to upload image");
                      }
                    });
                  },
                  file_picker_callback: (callback: any, value: any, meta: any) => {
                    const input = document.createElement("input");
                    input.setAttribute("type", "file");

                    if (meta.filetype === "image") {
                      input.setAttribute("accept", "image/*");
                    } else if (meta.filetype === "media") {
                      input.setAttribute("accept", "video/*");
                    }

                    input.onchange = function () {
                      const file = (this as HTMLInputElement).files?.[0];
                      if (!file) return;
                      
                      const reader = new FileReader();
                      reader.onload = function () {
                        callback(reader.result, { title: file.name });
                      };
                      reader.readAsDataURL(file);
                    };

                    input.click();
                  },
                  content_style:
                    "body { font-family:Arial,sans-serif; font-size:14px }",
                  placeholder: "Write your comments here...",
                }}
                onEditorChange={(newValue) => setCommentContent(newValue)}
              />
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-[#f5da9f] text-black rounded hover:bg-black hover:text-yellow-400 transition disabled:opacity-50"
                type="button"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Add Comment'}
              </button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={(e) => e.preventDefault()}
            className="space-y-4 border border-black p-4 rounded bg-gray-50"
          >
            <p className="mb-4">Logged in as {profile?.email}</p>

            <div className="border border-gray-300 rounded p-2 bg-white">
              <Editor
                apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                value={commentContent}
                init={{
                  height: 200,
                  menubar: false,
                  plugins: ["image", "link", "lists", "media", "table"],
                  toolbar:
                    "undo redo | fontfamily fontsize formatselect fontselect fontsizeselect | bold italic underline | alignleft aligncenter alignright | bullist numlist | link image media",
                  font_family_formats:
                    "Arial=arial,helvetica,sans-serif; Courier New=courier new,courier; Times New Roman=times new roman,times; Verdana=verdana,geneva;",
                  fontsize_formats: "10px 12px 14px 16px 18px 24px 36px",
                  automatic_uploads: true,
                  file_picker_types: "image media",
                  images_upload_handler: (blobInfo: any) => {
                    return new Promise((resolve, reject) => {
                      try {
                        const base64 = blobInfo.base64();
                        const mimeType = blobInfo.blob().type;
                        const dataUrl = `data:${mimeType};base64,${base64}`;
                        resolve(dataUrl);
                      } catch (err) {
                        reject("Failed to upload image");
                      }
                    });
                  },
                  file_picker_callback: (callback: any, value: any, meta: any) => {
                    const input = document.createElement("input");
                    input.setAttribute("type", "file");

                    if (meta.filetype === "image") {
                      input.setAttribute("accept", "image/*");
                    } else if (meta.filetype === "media") {
                      input.setAttribute("accept", "video/*");
                    }

                    input.onchange = function () {
                      const file = (this as HTMLInputElement).files?.[0];
                      if (!file) return;
                      
                      const reader = new FileReader();
                      reader.onload = function () {
                        callback(reader.result, { title: file.name });
                      };
                      reader.readAsDataURL(file);
                    };

                    input.click();
                  },
                  content_style:
                    "body { font-family:Arial,sans-serif; font-size:14px }",
                  placeholder: "Write your comments here...",
                }}
                onEditorChange={(newValue) => setCommentContent(newValue)}
              />
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-[#f5da9f] text-black rounded hover:bg-black hover:text-yellow-400 transition disabled:opacity-50"
                type="button"
                disabled={isLoading}
              >
                {isLoading ? 'Adding Comment...' : 'Add Comment'}
              </button>
            </div>
          </form>
        )}
      </div>
      <Footer />
    </div>
  );
}