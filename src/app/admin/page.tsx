'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { InactivityTimer } from '@/components/InactivityTimer'
import { SessionTimer } from '@/components/SessionTimer'
import { PoweredBy } from '@/components/PoweredBy'
import { LogoutConfirmDialog } from '@/components/LogoutConfirmDialog'
import { ExtendLicenseModal } from '@/components/ExtendLicenseModal'
import { EditLicenseModal } from '@/components/EditLicenseModal'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

interface License {
  id: string
  key: string
  email: string
  expiresAt: string
  createdAt: string
  updatedAt: string
}

export default function AdminPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [showTimer, setShowTimer] = useState(false)
  const [showExtendModal, setShowExtendModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null)
  const [formData, setFormData] = useState({
    key: '',
    email: '',
    expiresAt: ''
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    fetchLicenses()
  }, [])

  const fetchLicenses = async () => {
    try {
      const res = await fetch('/api/licenses')
      if (!res.ok) throw new Error('Failed to fetch licenses')
      const data = await res.json()
      setLicenses(data)
    } catch (error) {
      toast.error('Failed to load licenses')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.key || !formData.email || !formData.expiresAt) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setIsCreating(true)
      const res = await fetch('/api/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) throw new Error('Failed to create license')

      toast.success('License created successfully')
      fetchLicenses()
      setFormData({ key: '', email: '', expiresAt: '' })
    } catch (error) {
      toast.error('Failed to create license')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/licenses?id=${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Failed to delete license')

      toast.success('License deleted successfully')
      fetchLicenses()
    } catch (error) {
      toast.error('Failed to delete license')
    }
  }

  const generateLicenseKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const segments = Array.from({ length: 5 }, () =>
      Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    )
    const key = segments.join('-')
    setFormData(prev => ({ ...prev, key }))
  }

  const handleExtend = (license: License) => {
    setSelectedLicense(license)
    setShowExtendModal(true)
  }

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true)
      await fetchLicenses()
      toast.success('Licenses refreshed')
    } catch (error) {
      toast.error('Failed to refresh licenses')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleEdit = (license: License) => {
    setSelectedLicense(license)
    setShowEditModal(true)
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              License Management
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manage software license keys and their validity
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowPathIcon className={`w-5 h-5 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => router.push('/admin/profile')}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Profile
            </button>
            <button
              onClick={() => setShowLogoutDialog(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Create License Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Create New License</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <label htmlFor="key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  License Key *
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    id="key"
                    required
                    value={formData.key}
                    onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                    className="flex-1 block w-full min-w-0 px-3 py-2 rounded-l-md text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={generateLicenseKey}
                    className="relative -ml-px inline-flex items-center px-3 py-2 rounded-r-md border border-l-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    Generate
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 rounded-md text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Expiry Date *
                </label>
                <input
                  type="date"
                  id="expiresAt"
                  required
                  value={formData.expiresAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-1 block w-full px-3 py-2 rounded-md text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    'Create License'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Licenses Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    License Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {licenses.map((license) => (
                  <tr key={license.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {license.key}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {license.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {format(new Date(license.expiresAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {format(new Date(license.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(license)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleExtend(license)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Extend
                      </button>
                      <button
                        onClick={() => handleDelete(license.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {licenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No licenses found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Timers and Modals */}
      <InactivityTimer
        onTimerStart={() => setShowTimer(true)}
        onTimerReset={() => setShowTimer(false)}
      />
      {showTimer && <SessionTimer />}
      {showLogoutDialog && (
        <LogoutConfirmDialog
          onClose={() => setShowLogoutDialog(false)}
        />
      )}
      {showExtendModal && selectedLicense && (
        <ExtendLicenseModal
          license={selectedLicense}
          onClose={() => {
            setShowExtendModal(false)
            setSelectedLicense(null)
          }}
          onSuccess={fetchLicenses}
        />
      )}
      {showEditModal && selectedLicense && (
        <EditLicenseModal
          license={selectedLicense}
          onClose={() => {
            setShowEditModal(false)
            setSelectedLicense(null)
          }}
          onSuccess={fetchLicenses}
        />
      )}
      <PoweredBy className="fixed bottom-4 right-4" />
    </main>
  )
}  