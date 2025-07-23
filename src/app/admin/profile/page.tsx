'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Switch } from '@headlessui/react'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { PoweredBy } from '@/components/PoweredBy'

interface AdminProfile {
  id: string
  username: string
  name: string
  email: string
  profileImage: string | null
  mobileNumber: string | null
  lastKnownIp: string | null
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { status } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [setupEnabled, setSetupEnabled] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    mobileNumber: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const fetchProfile = useCallback(async () => {
    try {
      const [profileRes, setupRes] = await Promise.all([
        fetch('/api/admin/profile'),
        fetch('/api/admin/profile/setup-control')
      ])

      if (!profileRes.ok) {
        const profileData = await profileRes.json()
        throw new Error(profileData.error || 'Failed to fetch profile')
      }

      if (!setupRes.ok) {
        const setupData = await setupRes.json()
        throw new Error(setupData.error || 'Failed to fetch setup control status')
      }

      const profileData = await profileRes.json()
      const setupData = await setupRes.json()

      setProfile(profileData)
      setSetupEnabled(setupData.isSetupEnabled)
      setFormData(prev => ({
        ...prev,
        name: profileData.name,
        username: profileData.username,
        mobileNumber: profileData.mobileNumber || ''
      }))
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to load profile')
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchProfile()
    }
  }, [status, router, fetchProfile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          mobileNumber: formData.mobileNumber,
          currentPassword: formData.currentPassword || undefined,
          newPassword: formData.newPassword || undefined
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update profile')
      }

      toast.success('Profile updated successfully')
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))
      fetchProfile() // Refresh profile data
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSetupToggle = async () => {
    try {
      const response = await fetch('/api/admin/profile/setup-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSetupEnabled: !setupEnabled })
      })

      if (!response.ok) {
        throw new Error('Failed to update setup access')
      }

      const data = await response.json()
      setSetupEnabled(data.isSetupEnabled)
      toast.success('Setup page access updated')
    } catch (error) {
      console.error('Error updating setup access:', error)
      toast.error('Failed to update setup access')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f] p-4">
        <div className="h-8 w-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="text-4xl font-bold">Profile Settings</h1>
        </div>

        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 shadow-lg mb-8">
          <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
            <div>
              <span className="text-gray-400">Email</span>
              <p className="font-medium">{profile?.email}</p>
            </div>
            <div>
              <span className="text-gray-400">Last Login</span>
              <p className="font-medium">
                {profile?.lastLoginAt
                  ? new Date(profile.lastLoginAt).toLocaleString()
                  : 'Never'}
              </p>
            </div>
            <div>
              <span className="text-gray-400">Last Known IP</span>
              <p className="font-medium">{profile?.lastKnownIp || 'Unknown'}</p>
            </div>
            <div>
              <span className="text-gray-400">Account Created</span>
              <p className="font-medium">
                {new Date(profile?.createdAt || '').toLocaleDateString()}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="mobileNumber" className="block text-sm font-medium mb-2">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  id="mobileNumber"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-semibold mb-4">Change Password</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Setup Page Access</h3>
                  <p className="text-sm text-gray-400">Control access to the initial setup page</p>
                </div>
                <Switch
                  checked={setupEnabled}
                  onChange={handleSetupToggle}
                  className={`${
                    setupEnabled ? 'bg-blue-600' : 'bg-gray-700'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                >
                  <span
                    className={`${
                      setupEnabled ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      <PoweredBy />
    </div>
  )
} 