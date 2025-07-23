'use client'

import { useState, useEffect, useCallback } from 'react'

export function NetworkError() {
  const [isOnline, setIsOnline] = useState(true)
  const [mounted, setMounted] = useState(false)

  const checkConnection = useCallback(async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch('/api/health', {
        method: 'HEAD',
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      setIsOnline(response.ok)
    } catch (error) {
      setIsOnline(false)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    
    // Initial check
    checkConnection()

    // Listen to online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      checkConnection() // Verify connection
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Regular check every 5 seconds
    const interval = setInterval(checkConnection, 5000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [checkConnection])

  if (!mounted || isOnline) return null

  return (
    <div className="fixed inset-x-0 top-0 z-[100] p-4 bg-red-600 text-white text-center">
      <div className="flex items-center justify-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>No internet connection.</span>
        <button
          onClick={checkConnection}
          className="px-3 py-1 bg-white/20 rounded-full text-sm hover:bg-white/30 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  )
} 