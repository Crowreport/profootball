"use client";
// src/contexts/AuthContext.js - Updated for public schema
import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";

// Get admin emails from environment variable
const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];

// Create a context for auth
const AuthContext = createContext();

// Context provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [creatingProfile, setCreatingProfile] = useState(new Set());

  // Fetch user profile data (username) - using public schema
  const fetchUserProfile = async (userId) => {
    try {
      // First check if the users table exists
      const { error: tableCheckError } = await supabase
        .from("users")
        .select("id")
        .limit(1);

      // If there's an error about the table not existing
      if (tableCheckError && tableCheckError.code === "42P01") {
        console.error("users table does not exist, creating default profile");
        // Return a default profile with a generated username
        const currentUser = user || (await supabase.auth.getUser()).data?.user;
        return {
          username: currentUser?.email
            ? currentUser.email.split("@")[0]
            : "user",
        };
      }

      // If the table exists, proceed to fetch the profile
      const { data, error } = await supabase
        .from("users")
        .select("username")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);

        // If the profile doesn't exist, try to create one
        if (error.code === "PGRST116") {
          // Check if we're already creating a profile for this user
          if (creatingProfile.has(userId)) {
            console.log("Profile creation already in progress for user:", userId);
            // Wait a bit and try to fetch again
            await new Promise(resolve => setTimeout(resolve, 1000));
            const { data: retryData, error: retryError } = await supabase
              .from("users")
              .select("username")
              .eq("id", userId)
              .single();
            
            if (!retryError && retryData) {
              return retryData;
            }
          }

          console.log("Profile not found, attempting to create one");
          setCreatingProfile(prev => new Set(prev).add(userId));
          
          try {
            // Get current user data
            const currentUser =
              user || (await supabase.auth.getUser()).data?.user;
            const email = currentUser?.email || "";
            const defaultUsername = email.split("@")[0] || "user";

            // Insert into public.users
            const { data: newProfile, error: createError } = await supabase
              .from("users")
              .insert([{ id: userId, username: defaultUsername }])
              .select("username")
              .single();

            if (createError) {
              console.error("Error creating user profile:", createError);
              return { username: defaultUsername };
            }

            return newProfile;
          } finally {
            setCreatingProfile(prev => {
              const newSet = new Set(prev);
              newSet.delete(userId);
              return newSet;
            });
          }
        }

        // Fallback with current user data
        const currentUser = user || (await supabase.auth.getUser()).data?.user;
        return {
          username: currentUser?.email
            ? currentUser.email.split("@")[0]
            : "user",
        };
      }

      return data;
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
      const currentUser = user || (await supabase.auth.getUser()).data?.user;
      return {
        username: currentUser?.email ? currentUser.email.split("@")[0] : "user",
      };
    }
  };

  // Initialize auth state
  const initializeAuth = async () => {
    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        console.log("User session found:", session.user.email);
        setUser(session.user);

        // Fetch and set user profile
        const profile = await fetchUserProfile(session.user.id);
        setUserProfile(profile);
      } else {
        console.log("No user session found");
        setUser(null);
        setUserProfile(null);
      }
    } catch (error) {
      console.error("Error initializing auth:", error);
      setUser(null);
      setUserProfile(null);
    } finally {
      setLoading(false);
      setAuthInitialized(true);
    }
  };

  // Check and set user on load and auth state change
  useEffect(() => {
    // Initialize auth on component mount
    initializeAuth();

    // Set up listener for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed. Event:", event);

        if (session?.user) {
          console.log("User logged in:", session.user.email);
          
          // Only update if user actually changed to avoid duplicate processing
          if (!user || user.id !== session.user.id) {
            setUser(session.user);
            const profile = await fetchUserProfile(session.user.id);
            setUserProfile(profile);
          }
        } else {
          console.log("User logged out or session expired");
          setUser(null);
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    // Cleanup on unmount
    return () => {
      console.log("Cleaning up auth listener");
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Sign up with email, password, and username
  const signUp = async (email, password, username) => {
    try {
      // Check if the users table exists first
      const { error: tableCheckError } = await supabase
        .from("users")
        .select("id")
        .limit(1);

      // If there's an error about the table not existing, we'll handle it later
      if (tableCheckError && tableCheckError.code === "42P01") {
        console.warn(
          "users table does not exist yet. Will create during registration."
        );
        // Continue with registration, we'll handle the profile creation manually after
      } else {
        // If the table exists, check if username is already taken
        const { data: existingUser, error: checkError } = await supabase
          .from("users")
          .select("username")
          .eq("username", username)
          .single();

        if (existingUser) {
          return {
            data: null,
            error: { message: "Username is already taken" },
          };
        }
      }

      console.log("Signing up user with email:", email);

      // Sign up the user with metadata for the username
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          },
        },
      });

      if (error) {
        console.error("Sign up error:", error);
        throw error;
      }

      console.log("User signed up successfully:", data?.user?.email);

      // Skip manual profile creation - let auth state change handle it
      // to avoid race conditions

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Sign in with email only (not username)
  const signIn = async (email, password) => {
    try {
      console.log("Signing in user with email:", email);
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", error);
        setLoading(false);
        return { data: null, error };
      }

      console.log("User signed in successfully:", data?.user?.email);

      // Update local state immediately
      if (data?.user) {
        setUser(data.user);

        // Fetch and set user profile
        const profile = await fetchUserProfile(data.user.id);
        setUserProfile(profile);
      }

      setLoading(false);
      return { data, error: null };
    } catch (error) {
      console.error("Sign in exception:", error);
      setLoading(false);
      return { data: null, error };
    }
  };

  // Improved sign out function
  const signOut = async () => {
    try {
      console.log("Signing out user");
      setLoading(true);

      // Clear local state first
      setUser(null);
      setUserProfile(null);

      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Sign out error:", error);
        throw error;
      }

      console.log("User signed out successfully");

      // Return success result
      setLoading(false);
      return { error: null };
    } catch (error) {
      console.error("Error signing out:", error);
      setLoading(false);
      return { error };
    }
  };

  // Context value
  const value = {
    user,
    userProfile,
    loading,
    authInitialized,
    signUp,
    signIn,
    signOut,
    isAdmin: () => {
      return user?.email && ADMIN_EMAILS.includes(user.email);
    },
    refreshUserProfile: async (userId) => {
      if (!userId && user) userId = user.id;
      if (userId) {
        const profile = await fetchUserProfile(userId);
        setUserProfile(profile);
        return profile;
      }
      return null;
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
