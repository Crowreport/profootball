"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import DOMPurify from "isomorphic-dompurify";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { supabase } from "@/utils/supabase";
import { useUserStore } from "@/store/useUserStore";
import { censorText } from "@/utils/censor";
import { decodeHtmlEntities } from "@/utils/decodeHtmlEntities";
import { checkRateLimit } from "@/utils/ratelimit";

// Dynamically import TinyMCE Editor for SSR compatibility
const Editor = dynamic(
  () => import("@tinymce/tinymce-react").then((mod) => mod.Editor),
  { ssr: false }
);

const getStoredVotes = () => {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem('commentVotes') || '{}');
  } catch {
    return {};
  }
};

const setStoredVotes = (votes) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('commentVotes', JSON.stringify(votes));
};

export default function CommentsPage({ title, sourceTitle, sourceImage, sourceLink }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState("");
  const decodedTitle = decodeURIComponent(title);
  const [userVotes, setUserVotes] = useState({});

  useEffect(() => {
    setUserVotes(getStoredVotes());
  }, []);

  // You can remove this test query unless you specifically need it for debugging.
  // useEffect(() => {
  //   const testQuery = async () => {
  //     const { data, error } = await supabase
  //       .from("comments") // <--- REMOVED .schema("membership")
  //       .select("*")
  //       .limit(1);
  //     if (error) console.error("Test Query Error:", error);
  //     else console.log("Test Query Data:", data);
  //   };
  //   testQuery();
  // }, []);

  // Fetch comments from Supabase when component mounts or title changes
  useEffect(() => {
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from("comments") // <--- REMOVED .schema("membership")
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
        .order("created_at", { ascending: true }); // Order ascending to match insertion logic

      console.log("Fetched Comments:", data);

      if (error) {
        console.error("Error fetching comments:", error);
      } else {
        setComments(data);
      }
    };

    fetchComments();

    // Setup real-time listener for new comments if you want them to appear automatically
    const commentsChannel = supabase
      .channel("comments_changes")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen for all changes (INSERT, UPDATE, DELETE)
          schema: "public", // Specify the schema
          table: "comments",
          filter: `newsletter_title=eq.${decodedTitle}`, // Only listen for changes related to this title
        },
        (payload) => {
          console.log("Change received!", payload);
          // Refetch all comments for simplicity, or handle specific payload types
          fetchComments(); // Re-fetch to ensure order and full data
        }
      )
      .subscribe();

    // Clean up on component unmount
    return () => {
      commentsChannel.unsubscribe();
    };
  }, [decodedTitle]); // Depend on decodedTitle

  const handleSubmit = async () => {
    if (
      commentContent.trim() === "" ||
      commentContent === "<p><br></p>" ||
      commentContent === "<p></p>"
    )
      return alert("Please enter a comment.");

    // Rate limiting: max 5 comments per minute
    const userIp = 'client-' + (user?.id || 'anonymous');
    if (!checkRateLimit(userIp, 5)) {
      return alert("Too many comments. Please wait a moment (max 5 per minute).");
    }

    let currentUser = user;

    if (!currentUser) {
      if (email.trim() === "") return alert("Please enter an email.");
      if (password.trim() === "") return alert("Please enter a password.");

      // Ensure that signIn also returns data and error correctly.
      // Assuming signIn in AuthContext handles Supabase login and updates the user state.
      const { user: signedInUser, error: loginError } = await signIn(
        email,
        password
      );

      if (loginError) {
        return alert("Login failed: " + loginError.message);
      }

      if (!signedInUser) {
        // Check if user object is directly returned or nested
        alert("User not found after login. Please try again.");
        return;
      }

      currentUser = signedInUser; // Assign the directly returned user object
    }

    // Censor the comment content before saving
    // 1. Strip HTML tags, 2. Decode entities, 3. Censor
    const plainText = decodeHtmlEntities(commentContent.replace(/<[^>]+>/g, ' '));
    const censoredContent = censorText(plainText);

    const newCommentPayload = {
      // Renamed to avoid confusion with newComment object
      user_id: currentUser.id,
      newsletter_title: decodedTitle,
      content: censoredContent,
      // created_at and updated_at are handled by database defaults
      // votes_up and votes_down are handled by database defaults
    };

    // Insert new comment into Supabase
    const { data, error } = await supabase
      .from("comments") // <--- REMOVED .schema("membership")
      .insert([newCommentPayload]) // Use the payload object
      .select(
        `
        *,
        users (
          first_name,
          last_name
        )
      `
      );

    if (error) {
      alert("Error adding comment: " + error.message);
      console.error(error);
    } else {
      // Optimistically add the new comment to the state for instant feedback
      if (data && data[0]) {
        setComments((prevComments) => [...prevComments, data[0]]);
      }
      if (!rememberMe) {
        setEmail("");
        setPassword("");
      }
      setCommentContent("");
    }
  };

  const handleVote = async (index, type) => {
    const comment = comments[index];
    const votes = getStoredVotes();
    const prevVote = votes[comment.comment_id];
    if (prevVote === type) {
      // Already voted this way, do nothing
      return;
    }
    let updatedVotes = { ...votes, [comment.comment_id]: type };
    setStoredVotes(updatedVotes);
    setUserVotes(updatedVotes);

    // Calculate vote changes
    let votes_up = comment.votes_up;
    let votes_down = comment.votes_down;
    if (!prevVote) {
      // First time voting
      if (type === 'up') votes_up++;
      else votes_down++;
    } else {
      // Changing vote
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
    } else {
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
              <img
                src={decodeURIComponent(sourceImage)}
                alt={decodeURIComponent(sourceTitle)}
                className="w-10 h-10 mr-3 rounded-full object-cover"
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
                <li key={c.comment_id} className="border-b p-2 last:border-0 ">
                  {" "}
                  {/* Use unique ID for key */}
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
        {!user ? (
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
              />
              <label className="font-bold ml-4">Password:</label>
              <input
                type="password"
                placeholder="Password"
                className="border border-black px-2 py-1 rounded flex-1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
                  images_upload_handler: (blobInfo) => {
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
                  file_picker_callback: (callback, value, meta) => {
                    const input = document.createElement("input");
                    input.setAttribute("type", "file");

                    if (meta.filetype === "image") {
                      input.setAttribute("accept", "image/*");
                    } else if (meta.filetype === "media") {
                      input.setAttribute("accept", "video/*"); // accepts video
                    }

                    input.onchange = function () {
                      const file = this.files[0];
                      const reader = new FileReader();

                      reader.onload = function () {
                        // This will embed the video as a base64 blob
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
                className="px-4 py-2 bg-[#f5da9f] text-black rounded hover:bg-black hover:text-yellow-400 transition"
                type="button"
              >
                Add Comment
              </button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={(e) => e.preventDefault()}
            className="space-y-4 border border-black p-4 rounded bg-gray-50"
          >
            <p className="mb-4">Logged in as {user.email}</p>

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
                  images_upload_handler: (blobInfo) => {
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
                  file_picker_callback: (callback, value, meta) => {
                    const input = document.createElement("input");
                    input.setAttribute("type", "file");

                    if (meta.filetype === "image") {
                      input.setAttribute("accept", "image/*");
                    } else if (meta.filetype === "media") {
                      input.setAttribute("accept", "video/*"); // accepts video
                    }

                    input.onchange = function () {
                      const file = this.files[0];
                      const reader = new FileReader();

                      reader.onload = function () {
                        // This will embed the video as a base64 blob
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
                className="px-4 py-2 bg-[#f5da9f] text-black rounded hover:bg-black hover:text-yellow-400 transition"
                type="button"
              >
                Add Comment
              </button>
            </div>
          </form>
        )}
      </div>
      <Footer />
    </div>
  );
}
