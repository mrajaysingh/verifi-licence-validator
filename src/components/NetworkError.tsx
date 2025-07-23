'use client'

import { useState, useEffect, useCallback } from 'react'
import { WifiIcon, ArrowPathIcon, NoSymbolIcon } from '@heroicons/react/24/outline'

const CHECK_INTERVAL = 5000 // 5 seconds

export function NetworkError() {
  const [isOnline, setIsOnline] = useState(true)
  const [isRetrying, setIsRetrying] = useState(false)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [checkCount, setCheckCount] = useState(0)

  const checkConnection = useCallback(async () => {
    try {
      setIsRetrying(true)
      const controller = new AbortController()
      // Set timeout for the fetch request
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch('/api/health-check', {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        setIsOnline(true)
      } else {
        setIsOnline(false)
      }
    } catch (error) {
      console.error('Connection check failed:', error)
      setIsOnline(false)
    } finally {
      setIsRetrying(false)
      setLastChecked(new Date())
      setCheckCount(prev => prev + 1)
    }
  }, [])

  // Initial check on mount and setup periodic checks
  useEffect(() => {
    // Check immediately on mount
    checkConnection()

    // Set up periodic checks
    const intervalId = setInterval(checkConnection, CHECK_INTERVAL)

    // Cleanup
    return () => {
      clearInterval(intervalId)
    }
  }, [checkConnection])

  // Listen for online/offline events as backup
  useEffect(() => {
    function handleOnline() {
      checkConnection() // Verify the connection is really back
    }

    function handleOffline() {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [checkConnection])

  const handleManualRetry = () => {
    checkConnection()
  }

  if (isOnline) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/80 backdrop-blur-lg">
      <div className="relative bg-red-950/80 text-white p-10 rounded-2xl shadow-2xl backdrop-blur-sm max-w-md w-full mx-4 border border-red-500/20">
        <div className="absolute -top-1 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />
        <div className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />
        
        <div className="flex flex-col items-center text-center">
          <div className="relative w-16 h-16 mb-4">
            <WifiIcon className="w-16 h-16 text-red-500" />
            <NoSymbolIcon className="absolute inset-0 w-16 h-16 text-red-500 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Internet Connection</h2>
          <p className="text-gray-300 mb-2">
            Please check your internet connection and try again.
          </p>
          {lastChecked && (
            <p className="text-sm text-gray-400 mb-4">
              Last checked: {lastChecked.toLocaleTimeString()}
              <br />
              Auto-checking every 5 seconds...
            </p>
          )}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleManualRetry}
              disabled={isRetrying}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRetrying ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  Checking Connection...
                </>
              ) : (
                <>
                  <ArrowPathIcon className="w-5 h-5" />
                  Check Now
                </>
              )}
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              Attempt #{checkCount}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 