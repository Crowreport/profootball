"use client"

import Link from "next/link"
import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Cog6ToothIcon } from "@heroicons/react/24/outline"
import { useUserStore } from "@/store/useUserStore"
import { createClient } from "@/utils/supabase/component"

const Nav = () => {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { profile, isAuthenticated, clearProfile } = useUserStore()
  const supabase = createClient()

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const handleSignOut = async () => {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error("Sign out error:", error)
        return
      }

      // Clear Zustand store
      clearProfile()

      // Redirect to home
      router.push("/")
    } catch (error) {
      console.error("Sign out exception:", error)
    }
  }

  // Get username for display
  const displayName = profile?.username || profile?.firstName || "User"

  return (
    <nav className="bg-[#0B0B12] text-white px-6 py-6 shadow-md sticky top-0 z-50 font-['DM Sans']">
      <div className="max-w-8xl mx-auto flex justify-between items-center">
        {/* Logo + Title */}
        <Link href="/" className="flex items-center space-x-4">
          <Image src="/images/PFRlogo.jpg" alt="Logo" width={48} height={48} />
          <div className="text-white uppercase leading-tight text-4xl sm:text-5xl md:text-6xl lg:text-6xl font-['montage']">
            <div>PRO FOOTBALL REPORT</div>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex space-x-2 ml-4">
          {["Teams","Scores", "Standings", "Fantasy", "Sportsbooks", "Fanzone"].map((item) => (
            <Link
              key={item}
              href={`/${item.toLowerCase()}`}
              className="bg-[#ECCE8B] text-black px-4 py-2 text-sm rounded-md font-['DM Sans'] transition-all duration-200 hover:bg-black hover:text-[#ECCE8B] hover:border hover:border-[#ECCE8B] whitespace-nowrap"
            >
              {item}
            </Link>
          ))}
        </div>

        {/* Right Side Buttons */}
        <div className="hidden lg:flex items-center space-x-2">
          {isAuthenticated && profile ? (
            <>
              <span className="text-white text-sm mr-2">
                Welcome, {displayName}
              </span>
              <Link href="/settings">
                <button className="cursor-pointer bg-gray-600 text-white p-2 rounded-md hover:bg-gray-700 transition-all duration-200">
                  <Cog6ToothIcon className="h-5 w-5" />
                </button>
              </Link>
              <button
                onClick={handleSignOut}
                className="cursor-pointer bg-red-600 text-white px-4 py-2 text-sm rounded-md hover:bg-red-700 transition-all duration-200 font-['DM Sans']"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login">
                <button className="cursor-pointer bg-[#087994] text-white px-4 py-2 text-sm rounded-md hover:opacity-90 transition-all duration-200 font-['DM Sans']">
                  Login
                </button>
              </Link>
              <Link href="/signup">
                <button className="cursor-pointer bg-[#087994] text-white px-4 py-2 text-sm rounded-md hover:opacity-90 transition-all duration-200 font-['DM Sans']">
                  Sign Up
                </button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <div className="lg:hidden">
          <button onClick={toggleMenu} className="cursor-pointer">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden mt-4 grid grid-cols-3 gap-3 place-items-center">
          {["Teams", "Scores", "Standings", "Fantasy", "Sportsbooks", "Fanzone"].map((item) => (
            <Link
              key={item}
              href={`/${item.toLowerCase()}`}
              className="w-36 text-center bg-[#ECCE8B] text-black px-4 py-2 text-sm rounded-md font-['DM Sans'] transition-all duration-200 hover:bg-black hover:text-[#ECCE8B] hover:border hover:border-[#ECCE8B]"
            >
              {item}
            </Link>
          ))}
          {isAuthenticated && profile ? (
            <>
              <div className="w-36 text-center text-white text-xs">
                Welcome, {displayName}
              </div>
              <Link href="/settings">
                <button className="cursor-pointer w-12 bg-gray-600 text-white p-2 rounded-md hover:bg-gray-700 transition-all duration-200 flex items-center justify-center">
                  <Cog6ToothIcon className="h-5 w-5" />
                </button>
              </Link>
              <button
                onClick={handleSignOut}
                className="cursor-pointer w-36 bg-red-600 text-white px-4 py-2 text-sm rounded-md hover:bg-red-700 transition-all duration-200"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login">
                <button className="cursor-pointer w-36 bg-[#087994] text-white px-4 py-2 text-sm rounded-md hover:opacity-90 transition-all duration-200">
                  Login
                </button>
              </Link>
              <Link href="/signup">
                <button className="cursor-pointer w-36 bg-[#087994] text-white px-4 py-2 text-sm rounded-md hover:opacity-90 transition-all duration-200">
                  Sign Up
                </button>
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}

export default Nav