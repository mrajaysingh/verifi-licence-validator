'use client'

import { useState } from 'react'
import { CalendarIcon } from '@heroicons/react/24/outline'

interface ExtendLicenseModalProps {
  licenseId: string
  currentExpiry: string | null
  onClose: () => void
  onSuccess: () => void
}

export function ExtendLicenseModal({
  licenseId,
  currentExpiry,
  onClose,
  onSuccess
}: ExtendLicenseModalProps) {
  const [loading, setLoading] = useState(false)
  const [expiresAt, setExpiresAt] = useState(() => {
    // If current expiry exists, use it as default, otherwise use tomorrow's date
    if (currentExpiry) {
      return new Date(currentExpiry).toISOString().split('T')[0]
    }
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const response = await fetch(`/api/licenses/${licenseId}/extend`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresAt })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to extend license')
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error extending license:', error)
      // You might want to show an error toast here
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-black/80 text-white p-8 rounded-2xl shadow-2xl backdrop-blur-sm min-w-[400px] transition-all">
        <div className="absolute -top-1 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
        <div className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
        
        <h3 className="text-xl font-semibold mb-6">Extend License Validity</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-300 mb-2">
              New Expiration Date
            </label>
            <div className="relative">
              <input
                type="date"
                id="expiresAt"
                name="expiresAt"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-white pr-12"
                required
              />
              <CalendarIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Extend'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 