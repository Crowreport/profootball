// src/utils/supabase.js
// DEPRECATED: Use specific clients from /utils/supabase/ folder instead
// - For client components: import { createClient } from '@/utils/supabase/component'
// - For API routes: import createClient from '@/utils/supabase/api'
// - For getServerSideProps: import { createClient } from '@/utils/supabase/server-props'

import { createClient } from "@supabase/supabase-js";

// Create a single supabase client for interacting with your database
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing Supabase environment variables. Please check your .env.local file."
  );
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");

// Function to normalize titles for better matching
function normalizeTitle(title) {
  if (!title) return "";
  
  return title
    .trim()
    .toLowerCase()
    // Remove common punctuation that might differ
    .replace(/[?.,!;:'"`]/g, "")
    // Remove extra whitespace
    .replace(/\s+/g, " ")
    // Remove common suffixes that might be truncated
    .replace(/\s+chuba\s+hubbard\s+keeps\s+dream\s+alive$/i, "")
    .replace(/\s+per\s+report$/i, "")
    .replace(/\s+watch$/i, "")
    .replace(/\s+highlights?$/i, "")
    .replace(/\s+video$/i, "")
    .replace(/\s+update$/i, "")
    .replace(/\s+breaking$/i, "")
    .replace(/\s+news$/i, "")
    .replace(/\s+analysis$/i, "")
    .replace(/\s+report$/i, "")
    .replace(/\s+notes$/i, "")
    .replace(/\s+rumors$/i, "")
    .replace(/\s+signing$/i, "")
    .replace(/\s+signs$/i, "")
    .replace(/\s+agrees$/i, "")
    .replace(/\s+deal$/i, "")
    .replace(/\s+contract$/i, "")
    .replace(/\s+extension$/i, "")
    .replace(/\s+injury$/i, "")
    .replace(/\s+injury$/i, "")
    .replace(/\s+out$/i, "")
    .replace(/\s+questionable$/i, "")
    .replace(/\s+doubtful$/i, "")
    .replace(/\s+probable$/i, "")
    .replace(/\s+active$/i, "")
    .replace(/\s+inactive$/i, "")
    .replace(/\s+suspended$/i, "")
    .replace(/\s+released$/i, "")
    .replace(/\s+waived$/i, "")
    .replace(/\s+cut$/i, "")
    .replace(/\s+retired$/i, "")
    .replace(/\s+retirement$/i, "")
    .replace(/\s+draft$/i, "")
    .replace(/\s+free\s+agency$/i, "")
    .replace(/\s+free\s+agent$/i, "")
    .replace(/\s+trade$/i, "")
    .replace(/\s+traded$/i, "")
    .replace(/\s+acquired$/i, "")
    .replace(/\s+signing$/i, "")
    .replace(/\s+signs$/i, "")
    .replace(/\s+agrees$/i, "")
    .replace(/\s+deal$/i, "")
    .replace(/\s+contract$/i, "")
    .replace(/\s+extension$/i, "")
    .replace(/\s+injury$/i, "")
    .replace(/\s+out$/i, "")
    .replace(/\s+questionable$/i, "")
    .replace(/\s+doubtful$/i, "")
    .replace(/\s+probable$/i, "")
    .replace(/\s+active$/i, "")
    .replace(/\s+inactive$/i, "")
    .replace(/\s+suspended$/i, "")
    .replace(/\s+released$/i, "")
    .replace(/\s+waived$/i, "")
    .replace(/\s+cut$/i, "")
    .replace(/\s+retired$/i, "")
    .replace(/\s+retirement$/i, "")
    .replace(/\s+draft$/i, "")
    .replace(/\s+free\s+agency$/i, "")
    .replace(/\s+free\s+agent$/i, "")
    .replace(/\s+trade$/i, "")
    .replace(/\s+traded$/i, "")
    .replace(/\s+acquired$/i, "")
    .trim();
}

// Function to fetch comment counts for articles
export async function getCommentCounts(articleTitles) {
  try {
    console.log("Fetching comment counts for titles:", articleTitles.length, "titles");
    
    // Limit to first 50 titles to avoid query size limits
    const limitedTitles = articleTitles.slice(0, 50);
    
    if (limitedTitles.length === 0) {
      console.log("No titles to fetch comments for");
      return {};
    }

    // First, get all comment titles from database
    const { data: allComments, error: fetchError } = await supabase
      .from("comments")
      .select("newsletter_title");

    if (fetchError) {
      console.error("Error fetching all comments:", fetchError);
      return {};
    }

    if (!allComments) {
      console.log("No comments found in database");
      return {};
    }

    // Create a map of normalized database titles to their counts
    const dbTitleCounts = {};
    allComments.forEach((comment) => {
      const normalizedTitle = normalizeTitle(comment.newsletter_title);
      if (normalizedTitle) {
        dbTitleCounts[normalizedTitle] = (dbTitleCounts[normalizedTitle] || 0) + 1;
      }
    });

    console.log("Database title counts (normalized):", dbTitleCounts);

    // Now match RSS titles to database titles
    const commentCounts = {};
    limitedTitles.forEach((rssTitle) => {
      const normalizedRssTitle = normalizeTitle(rssTitle);
      const count = dbTitleCounts[normalizedRssTitle] || 0;
      commentCounts[rssTitle] = count;
      
      if (count > 0) {
        console.log(`Match found: "${rssTitle}" -> "${normalizedRssTitle}" (${count} comments)`);
      }
    });

    console.log("Final comment counts object:", commentCounts);
    return commentCounts;
  } catch (error) {
    console.error("Error in getCommentCounts:", error);
    return {};
  }
}

// Function to get all comment titles from database (for debugging)
export async function getAllCommentTitles() {
  try {
    const { data, error } = await supabase
      .from("comments")
      .select("newsletter_title")
      .limit(10);

    if (error) {
      console.error("Error fetching comment titles:", error);
      return [];
    }

    console.log("Sample comment titles from database:", data?.map(c => c.newsletter_title));
    return data?.map(c => c.newsletter_title) || [];
  } catch (error) {
    console.error("Error in getAllCommentTitles:", error);
    return [];
  }
}
