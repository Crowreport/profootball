"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserIcon, EnvelopeIcon, IdentificationIcon, ShieldCheckIcon, PencilIcon } from '@heroicons/react/24/outline'

import { useUserStore } from '@/store/useUserStore'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export default function SettingsPage() {
  const router = useRouter()
  const { profile, isAuthenticated, setProfile } = useUserStore()
  const [isClient, setIsClient] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: ''
  })

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isClient, router])

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        firstName: profile.firstName || '',
        lastName: profile.lastName || ''
      })
    }
  }, [profile])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    setError('')
    setMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          firstName: formData.firstName,
          lastName: formData.lastName
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update profile')
        return
      }

      // Update Zustand store with new data
      setProfile({
        id: data.user.id,
        username: data.user.username,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        role: data.user.role,
        email: data.user.email
      })

      setMessage('Profile updated successfully!')
      setIsEditing(false)
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000)

    } catch (error) {
      console.error('Update error:', error)
      setError('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset form data to original profile values
    if (profile) {
      setFormData({
        username: profile.username || '',
        firstName: profile.firstName || '',
        lastName: profile.lastName || ''
      })
    }
    setIsEditing(false)
    setError('')
    setMessage('')
  }

  if (!isClient) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated || !profile) {
    return null
  }

  return (
    <div>
      <Nav />
      <div className="pt-20 pb-20 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-[#087994] px-6 py-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-white bg-opacity-20 p-3 rounded-full">
                    <UserIcon className="h-8 w-8 text-white" />
                  </div>
                  <div className="ml-4">
                    <h1 className="text-2xl font-bold text-white">Account Settings</h1>
                    <p className="text-blue-100">Manage your profile information</p>
                  </div>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="cursor-pointer bg-green-500 bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2"
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
            </div>

            {/* Profile Information */}
            <div className="p-6 space-y-6">
              {/* Error and Success Messages */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {message && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                  {message}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <IdentificationIcon className="h-4 w-4 mr-2 text-gray-500" />
                    First Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter first name"
                      disabled={isLoading}
                    />
                  ) : (
                    <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{profile.firstName || 'Not provided'}</p>
                    </div>
                  )}
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <IdentificationIcon className="h-4 w-4 mr-2 text-gray-500" />
                    Last Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter last name"
                      disabled={isLoading}
                    />
                  ) : (
                    <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{profile.lastName || 'Not provided'}</p>
                    </div>
                  )}
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
                    Username
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter username"
                      required
                      disabled={isLoading}
                    />
                  ) : (
                    <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{profile.username}</p>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-500" />
                    Email Address
                  </label>
                  <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                    <p className="text-gray-900">{profile.email || 'Not provided'}</p>
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                </div>
              </div>

              {/* Edit Mode Actions */}
              {isEditing && (
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="cursor-pointer px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isLoading || !formData.username.trim()}
                    className="cursor-pointer px-4 py-2 bg-[#087994] text-white rounded-lg hover:bg-[#065f74] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}

              {/* Role */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <ShieldCheckIcon className="h-4 w-4 mr-2 text-gray-500" />
                  Account Role
                </label>
                <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    profile.role === 'admin' 
                      ? 'bg-red-100 text-red-800'
                      : profile.role === 'moderator'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                  </span>
                </div>
              </div>

              {/* Account Info */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    Your account is verified and active. For any changes to your profile information, 
                    please contact the site administrator.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}