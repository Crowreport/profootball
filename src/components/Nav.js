"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getCurrentUser, signOut } from "@/utils/supabase";

const Nav = () => {
  // State for mobile menu toggle
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for user session on component mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Error checking user:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Add auth state change listener
    const handleAuthChange = () => {
      checkUser();
    };

    window.addEventListener("supabase.auth", handleAuthChange);

    return () => {
      window.removeEventListener("supabase.auth", handleAuthChange);
    };
  }, []);

  // Toggle mobile menu open/close
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      window.dispatchEvent(new Event("supabase.auth"));
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav
      className={`bg-[#0B0B12] text-gray-900 border-gray-300 shadow-md px-6 py-1 mb-3 sticky top-0 z-50 transition-all duration-300 ease-in-out`}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-white">
          <span className="navtitle">ProFootball News</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-6">
          <Link
            href="/"
            className={`bg-[#f5da9f] border border-[#f5da9f] p-4 text-black hover:text-[#f5da9f] hover:bg-[#0B0B12] py-2 px-4 rounded-md transition-all duration-200`}
          >
            Teams
          </Link>
          <Link
            href="/about"
            className={`bg-[#f5da9f] border border-[#f5da9f] p-4 text-black hover:text-[#f5da9f] hover:bg-[#0B0B12] py-2 px-4 rounded-md transition-all duration-200`}
          >
            Fantasy
          </Link>
          <Link
            href="/contact"
            className={`bg-[#f5da9f] border border-[#f5da9f] p-4 text-black hover:text-[#f5da9f] hover:bg-[#0B0B12] py-2 px-4 rounded-md transition-all duration-200`}
          >
            Betting
          </Link>
          <Link
            href="/contact"
            className={`bg-[#f5da9f] border border-[#f5da9f] p-4 text-black hover:text-[#f5da9f] hover:bg-[#0B0B12] py-2 px-4 rounded-md transition-all duration-200`}
          >
            Fanzone
          </Link>

          {/* Auth buttons - Simple approach */}
          {loading ? (
            <span className="border border-[#f5da9f] text-[#f5da9f] py-2 px-4 rounded-md">
              Loading...
            </span>
          ) : user ? (
            <button
              onClick={handleSignOut}
              className="border border-[#f5da9f] text-[#f5da9f] hover:bg-[#f5da9f] hover:text-black transition-all duration-200 py-2 px-4 rounded-md"
            >
              Sign Out
            </button>
          ) : (
            <Link
              href="/auth/signin"
              className="border border-[#f5da9f] text-[#f5da9f] hover:bg-[#f5da9f] hover:text-black transition-all duration-200 py-2 px-4 rounded-md"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile Menu Icon */}
        <div className="md:hidden">
          <button
            onClick={toggleMenu}
            className="flex flex-col justify-between items-center w-8 h-6 space-y-1"
          >
            <div
              className={`h-1 w-8 bg-white transition-all duration-300 ${
                isOpen ? "rotate-45 absolute" : ""
              }`}
            />
            <div
              className={`h-1 w-8 bg-white transition-all duration-300 ${
                isOpen ? "opacity-0" : ""
              }`}
            />
            <div
              className={`h-1 w-8 bg-white transition-all duration-300 ${
                isOpen ? "-rotate-45 absolute" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden mt-4 space-y-4 px-4 pb-4">
          <Link
            href="/"
            className="bg-[#f5da9f] border border-[#f5da9f] p-4 text-black hover:text-[#f5da9f] hover:bg-[#0B0B12] py-2 px-4 rounded-md block transition-all duration-200"
          >
            Teams
          </Link>
          <Link
            href="/about"
            className="bg-[#f5da9f] border border-[#f5da9f] p-4 text-black hover:text-[#f5da9f] hover:bg-[#0B0B12] py-2 px-4 rounded-md block transition-all duration-200"
          >
            Fantasy
          </Link>
          <Link
            href="/contact"
            className="bg-[#f5da9f] border border-[#f5da9f] p-4 text-black hover:text-[#f5da9f] hover:bg-[#0B0B12] py-2 px-4 rounded-md block transition-all duration-200"
          >
            Betting
          </Link>
          <Link
            href="/contact"
            className="bg-[#f5da9f] border border-[#f5da9f] p-4 text-black hover:text-[#f5da9f] hover:bg-[#0B0B12] py-2 px-4 rounded-md block transition-all duration-200"
          >
            Fanzone
          </Link>

          {/* Mobile Auth buttons */}
          {loading ? (
            <div className="block w-full border border-[#f5da9f] text-[#f5da9f] py-2 px-4 rounded-md text-center">
              Loading...
            </div>
          ) : user ? (
            <button
              onClick={handleSignOut}
              className="block w-full border border-[#f5da9f] text-[#f5da9f] hover:bg-[#f5da9f] hover:text-black transition-all duration-200 py-2 px-4 rounded-md text-center"
            >
              Sign Out
            </button>
          ) : (
            <Link
              href="/auth/signin"
              className="block w-full border border-[#f5da9f] text-[#f5da9f] hover:bg-[#f5da9f] hover:text-black transition-all duration-200 py-2 px-4 rounded-md text-center"
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Nav;
