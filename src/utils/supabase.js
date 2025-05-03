"use client";

import { createClient } from "@supabase/supabase-js";

// Initialize the Supabase client - keep it simple, client-side only
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// Simple auth helpers
export const signIn = (email, password) => {
  return supabase.auth.signInWithPassword({ email, password });
};

export const signUp = (email, password) => {
  return supabase.auth.signUp({ email, password });
};

export const signOut = () => {
  return supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.user || null;
};
