"use client"

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { EnvelopeIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

import { createClient } from '@/utils/supabase/component'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

function CheckEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const supabase = createClient()
  
  const [isResending, setIsResending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function resendVerification() {
    if (!email) {
      setError("Email not found. Please sign up again.")
      return
    }

    setIsResending(true)
    setError('')
    setMessage('')
    
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/confirm`
      }
    })

    setIsResending(false)

    if (resendError) {
      setError(resendError.message)
    } else {
      setMessage("Verification email sent!")
    }
  }

  return (
    <div className="pt-20 pb-15 bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
            <EnvelopeIcon className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Check your email</h2>
          <p className="mt-2 text-sm text-gray-600">
            We&apos;ve sent a verification link to
          </p>
          {email && (
            <p className="mt-1 text-sm font-medium text-gray-900">{email}</p>
          )}
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

          <div className="text-center space-y-4">
            <p className="text-gray-700">
              Click the link in your email to verify your account and complete your registration.
            </p>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Can&apos;t find the email?</strong> Check your spam folder or try resending the verification email.
              </p>
            </div>

            <button
              type="button"
              onClick={resendVerification}
              disabled={isResending || !email}
              className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? (
                <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
              ) : (
                <EnvelopeIcon className="-ml-1 mr-2 h-4 w-4" />
              )}
              {isResending ? 'Sending...' : 'Resend verification email'}
            </button>
          </div>
        </div>
        
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            Already verified your email?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in here
            </Link>
          </p>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Having trouble? Contact our support team for help.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function CheckEmailPage() {
  return (
    <div>
      <Nav />
      <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="text-gray-600">Loading...</div></div>}>
        <CheckEmailContent />
      </Suspense>
      <Footer />
    </div>
  )
}