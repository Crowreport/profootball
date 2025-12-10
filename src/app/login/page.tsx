"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

import { createClient } from '@/utils/supabase/component'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { useUserStore } from '@/store/useUserStore'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const setProfile = useUserStore(s => s.setProfile)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return
    
    const message = searchParams.get('message')
    if (message === 'email-verified') {
      setMessage("Email verified successfully! You can now sign in.")
    } else if (message === 'verification-error') {
      setError("Email verification failed. Please try again.")
    } else if (message === 'password-updated') {
      setMessage("Password updated successfully! Please sign in with your new password.")
    }
  }, [searchParams, isClient])

  async function logIn() {
    setError('')
    setMessage('')
    setLoading(true)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    })
    
    if (signInError) {
      setLoading(false)
      // Check if error is specifically about email not being confirmed
      if (signInError.message === "Email not confirmed") {
        setError("Please verify your email before signing in")
        router.push(`/check-email?email=${encodeURIComponent(email)}`)
      } else {
        setError("Invalid credentials, please check your email or password")
      }
      return
    }

    // Fetch user from our database and store in Zustand
    if (data.user) {
      try {
        // Query the users table for profile data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, username, first_name, last_name, role')
          .eq('id', data.user.id)
          .single()

        if (userError || !userData) {
          setLoading(false)
          setError("Login successful, but couldn't load profile")
          return
        }

        // Store profile in Zustand
        setProfile({
          id: data.user.id,
          username: userData.username,
          firstName: userData.first_name,
          lastName: userData.last_name,
          role: userData.role,
          email: data.user.email
        })

        setMessage("You've successfully signed in!")
        
        // Redirect to home
        setTimeout(() => {
          router.push('/')
        }, 1000)

      } catch (profileError) {
        console.error('Profile fetch failed:', profileError)
        setLoading(false)
        setError("Login successful, but couldn't load profile")
      }
    }
  }

  return (
    <div className="pt-20 pb-20 bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back!</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your Pro Football Account
          </p>
        </div>
        
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {message}
            </div>
          )}

          <form className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-black px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <button
                type="button"
                onClick={logIn}
                disabled={loading}
                className="w-full cursor-pointer flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#087994] hover:bg-[#065f74] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
              
              <div className="text-center">
                <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
                  Forgot your password?
                </Link>
              </div>
            </div>
          </form>
          <div className="text-center">
            <p className="text-sm text-gray-600 mt-5">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
        

        <div className="text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div>
      <Nav />
      <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="text-gray-600">Loading...</div></div>}>
        <LoginForm />
      </Suspense>
      <Footer />
    </div>
  )
}