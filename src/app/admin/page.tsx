'use client'

import { useState, useEffect } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { PlusIcon, TrashIcon, ClockIcon, UserCircleIcon, CalendarIcon, Cog6ToothIcon, SparklesIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { InactivityTimer } from '@/components/InactivityTimer'
import { SessionTimer } from '@/components/SessionTimer'
import { ExtendLicenseModal } from '@/components/ExtendLicenseModal'
import { NetworkError } from '@/components/NetworkError'
import { generateLicenseKey } from '@/lib/utils'

interface License {
  id: string
  key: string
  email: string
  domain: string | null
  isActive: boolean
  createdAt: string
  activatedAt: string | null
  expiresAt: string | null
  createdBy: {
    name: string
    email: string
  } | null
}

export default function AdminPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [licenses, setLicenses] = useState<License[]>([])
  const [ipAddress, setIpAddress] = useState<string>('Loading...')
  const [loginTime, setLoginTime] = useState<string>('')
  const [formData, setFormData] = useState({
    key: '',
    email: '',
    domain: '',
    expiresAt: ''
  })
  const [timerActive, setTimerActive] = useState(false)
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Get login time
    const now = new Date()
    setLoginTime(now.toLocaleTimeString())
    
    // Get IP address
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setIpAddress(data.ip))
      .catch(() => setIpAddress('Unable to fetch IP'))
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchLicenses()
    }
  }, [status, router])

  const fetchLicenses = async () => {
    try {
      const response = await fetch('/api/licenses')
      if (!response.ok) {
        throw new Error('Failed to fetch licenses')
      }
      const data = await response.json()
      setLicenses(data)
    } catch (error) {
      console.error('Error fetching licenses:', error)
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        signOut({ redirect: true, callbackUrl: '/login' })
      } else {
        toast.error('Failed to fetch licenses')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCreateLicense = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.key || !formData.key.match(/^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/)) {
      toast.error('Please enter a valid license key in the correct format')
      return
    }

    if (!formData.email || !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error('Please enter a valid email address')
      return
    }

    if (!formData.expiresAt) {
      toast.error('Please select an expiration date')
      return
    }

    // Validate expiration date is in the future
    const expiryDate = new Date(formData.expiresAt)
    if (expiryDate <= new Date()) {
      toast.error('Expiration date must be in the future')
      return
    }

    try {
      const response = await fetch('/api/licenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create license')
      }

      toast.success('License created successfully')
      setFormData({
        key: '',
        email: '',
        domain: '',
        expiresAt: ''
      })
      fetchLicenses()
    } catch (error) {
      console.error('Error creating license:', error)
      if (error instanceof Error && error.message === 'Failed to fetch') {
        // Network error is handled by NetworkError component
        return
      }
      toast.error(error instanceof Error ? error.message : 'Failed to create license')
    }
  }

  const handleDeleteLicense = async (id: string) => {
    try {
      const response = await fetch(`/api/licenses/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete license')
      }

      toast.success('License deleted successfully')
      fetchLicenses()
    } catch (error) {
      console.error('Error deleting license:', error)
      if (error instanceof Error && error.message === 'Failed to fetch') {
        // Network error is handled by NetworkError component
        return
      }
      toast.error('Failed to delete license')
    }
  }

  const handleExtendLicense = (license: License) => {
    setSelectedLicense(license)
  }

  const handleExtendSuccess = () => {
    toast.success('License extended successfully')
    fetchLicenses()
  }

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true)
  }

  const handleLogoutConfirm = async () => {
    setShowLogoutConfirm(false)
    await signOut({ redirect: true, callbackUrl: '/login' })
  }

  const handleTimerStart = () => {
    setTimerActive(true)
  }

  const handleTimerReset = () => {
    setTimerActive(false)
  }

  const handleGenerateKey = () => {
    const newKey = generateLicenseKey()
    setFormData(prev => ({
      ...prev,
      key: newKey
    }))
    toast.success('License key generated')
  }

  if (!mounted || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f] p-4">
        <div className="h-8 w-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <NetworkError />
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bold">License Manager</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/profile')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Cog6ToothIcon className="w-5 h-5" />
                Profile Settings
              </button>
              <button
                onClick={handleLogoutClick}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
          
          <div className="backdrop-blur-lg bg-white/5 rounded-lg p-4 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <UserCircleIcon className="w-5 h-5" />
              <span className="text-gray-300">User: </span>
              <span className="font-medium">{session?.user?.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5" />
              <span className="text-gray-300">Login Time: </span>
              <span className="font-medium">{loginTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-300">IP Address: </span>
              <span className="font-medium">{ipAddress}</span>
            </div>
          </div>
        </div>

        {/* Create License Form */}
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 mb-8 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Create New License</h2>
          <form onSubmit={handleCreateLicense} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="key" className="block text-sm font-medium mb-1">
                License Key <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="key"
                  name="key"
                  value={formData.key}
                  onChange={handleInputChange}
                  className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  required
                  pattern="[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}"
                  title="License key must be in the format: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                  placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                />
                <button
                  type="button"
                  onClick={handleGenerateKey}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  title="Generate License Key"
                >
                  <SparklesIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                title="Please enter a valid email address"
              />
            </div>
            <div>
              <label htmlFor="domain" className="block text-sm font-medium mb-1">
                Domain
              </label>
              <input
                type="text"
                id="domain"
                name="domain"
                value={formData.domain}
                onChange={handleInputChange}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="example.com (optional)"
              />
            </div>
            <div>
              <label htmlFor="expiresAt" className="block text-sm font-medium mb-1">
                Expiration Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="expiresAt"
                name="expiresAt"
                value={formData.expiresAt}
                onChange={handleInputChange}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min={new Date().toISOString().split('T')[0]}
                title="Please select a future date"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full md:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                Create License
              </button>
            </div>
          </form>
        </div>

        {/* Licenses List */}
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 shadow-lg overflow-x-auto">
          <h2 className="text-2xl font-semibold mb-4">Licenses</h2>
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="h-8 w-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          ) : licenses.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No licenses found</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-white/10">
                  <th className="pb-2">Key</th>
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Domain</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Created</th>
                  <th className="pb-2">Expires</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {licenses.map((license) => (
                  <tr key={license.id} className="border-b border-white/5">
                    <td className="py-3 font-mono text-sm">{license.key}</td>
                    <td className="py-3">{license.email}</td>
                    <td className="py-3">{license.domain || '-'}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          license.isActive
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {license.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3">{new Date(license.createdAt).toLocaleDateString()}</td>
                    <td className="py-3">
                      {license.expiresAt
                        ? new Date(license.expiresAt).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleExtendLicense(license)}
                          className="p-1 hover:bg-blue-500/20 rounded-lg transition-colors"
                          title="Extend License"
                        >
                          <CalendarIcon className="w-5 h-5 text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteLicense(license.id)}
                          className="p-1 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Delete License"
                        >
                          <TrashIcon className="w-5 h-5 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <Transition appear show={showLogoutConfirm} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowLogoutConfirm(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/75" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-[#1a1a1a] p-6 text-left align-middle shadow-xl transition-all border border-white/10">
                  <div className="flex items-center gap-4 text-yellow-400 mb-4">
                    <ExclamationTriangleIcon className="h-6 w-6" />
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6">
                      Confirm Logout
                    </Dialog.Title>
                  </div>

                  <div className="mt-2">
                    <p className="text-sm text-gray-300">
                      Are you sure you want to log out? Any unsaved changes will be lost.
                    </p>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                      onClick={() => setShowLogoutConfirm(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-lg border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      onClick={handleLogoutConfirm}
                    >
                      Logout
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <InactivityTimer onTimerStart={handleTimerStart} onTimerReset={handleTimerReset} />
      <SessionTimer isActive={timerActive} onReset={handleTimerReset} />
      {selectedLicense && (
        <ExtendLicenseModal
          licenseId={selectedLicense.id}
          currentExpiry={selectedLicense.expiresAt}
          onClose={() => setSelectedLicense(null)}
          onSuccess={handleExtendSuccess}
        />
      )}
    </div>
  )
} 