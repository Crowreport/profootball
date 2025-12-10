"use client"

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

import { createClient } from '@/utils/supabase/component'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function sendResetEmail() {
    if (!email) {
      setError("Please enter your email address")
      return
    }

    setIsLoading(true)
    setError('')
    setMessage('')
    
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    setIsLoading(false)

    if (resetError) {
      setError(resetError.message)
    } else {
      setEmailSent(true)
      setMessage("Password reset email sent!")
    }
  }

  if (emailSent) {
    return (
      <div>
        <Nav />
        <div className="pt-20 pb-15 bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">Check your email</h2>
              <p className="mt-2 text-sm text-gray-600">
                We&apos;ve sent a password reset link to
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">{email}</p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
              {message && (
                <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                  {message}
                </div>
              )}

              <div className="text-center space-y-4">
                <p className="text-gray-700">
                  Click the link in your email to reset your password. The link will expire in 1 hour.
                </p>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Can&apos;t find the email?</strong><br />
                    Check your spam folder or try sending another reset email.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEmailSent(false)
                    setEmail('')
                    setMessage('')
                  }}
                  className="inline-flex cursor-pointer items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Send another email
                </button>
              </div>
            </div>
            
            <div className="text-center">
              <Link href="/login" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div>
      <Nav />
      <div className="pt-20 pb-15 bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Forgot your password?</h2>
            <p className="mt-2 text-sm text-gray-600">
              No worries! Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
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
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <button
                  type="button"
                  onClick={sendResetEmail}
                  disabled={isLoading}
                  className="w-full cursor-pointer flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#087994] hover:bg-[#065f74] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : 'Send reset email'}
                </button>
              </div>
            </form>
          </div>
          
          <div className="text-center">
            <Link href="/login" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 font-medium">
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}