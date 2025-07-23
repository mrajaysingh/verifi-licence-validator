'use client'

import { useEffect, useState, useCallback } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const LOGOUT_TIME = 5 * 60 * 1000 // 5 minutes
const UPDATE_INTERVAL = 10 // Update every 10ms for smooth countdown
const FADE_DURATION = 500 // Duration for fade transitions

interface SessionTimerProps {
  isActive: boolean
  onReset: () => void
}

export function SessionTimer({ isActive, onReset }: SessionTimerProps) {
  const router = useRouter()
  const [timeLeft, setTimeLeft] = useState(LOGOUT_TIME)
  const [opacity, setOpacity] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  const handleLogout = useCallback(async () => {
    try {
      await signOut({ redirect: false })
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
      router.push('/login')
    }
  }, [router])

  const handleActivity = useCallback(() => {
    if (isActive) {
      setOpacity(0)
      setTimeout(() => {
        setIsVisible(false)
        onReset()
      }, FADE_DURATION)
    }
  }, [isActive, onReset])

  useEffect(() => {
    let countdownInterval: NodeJS.Timeout
    let fadeInTimeout: NodeJS.Timeout

    if (isActive) {
      // Reset timer and start fade in
      setTimeLeft(LOGOUT_TIME)
      setIsVisible(true)
      fadeInTimeout = setTimeout(() => setOpacity(1), 100)

      // Start countdown
      countdownInterval = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - UPDATE_INTERVAL
          if (newTime <= 0) {
            clearInterval(countdownInterval)
            handleLogout()
            return 0
          }
          return newTime
        })
      }, UPDATE_INTERVAL)
    } else {
      // Clear timer and fade out
      setOpacity(0)
      setTimeout(() => {
        setIsVisible(false)
      }, FADE_DURATION)
      clearInterval(countdownInterval)
    }

    return () => {
      clearInterval(countdownInterval)
      clearTimeout(fadeInTimeout)
    }
  }, [isActive, handleLogout])

  // Set up activity listeners
  useEffect(() => {
    const events = [
      'mousemove',
      'mousedown',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ]

    events.forEach(event => {
      document.addEventListener(event, handleActivity)
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
    }
  }, [handleActivity])

  // Don't render if not visible
  if (!isVisible) {
    return null
  }

  const minutes = Math.floor(timeLeft / (60 * 1000))
  const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000)
  const milliseconds = Math.floor((timeLeft % 1000) / 10)

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-500"
        style={{ opacity }}
      />
      
      {/* Timer Display */}
      <div 
        className="relative bg-black/80 text-white p-10 rounded-2xl shadow-2xl backdrop-blur-sm min-w-[400px] transition-all duration-500 flex flex-col items-center"
        style={{ 
          opacity,
          transform: `scale(${opacity === 1 ? '1' : '0.95'})`,
        }}
      >
        <div className="absolute -top-1 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />
        <div className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />
        
        <p className="text-center text-red-500 font-bold text-6xl font-mono tracking-wider mb-2 tabular-nums">
          {String(minutes).padStart(2, '0')}
          <span className="text-red-700">:</span>
          {String(seconds).padStart(2, '0')}
          <span className="text-red-700">.</span>
          {String(milliseconds).padStart(2, '0')}
        </p>
        <p className="text-center mt-4 text-gray-300 text-base">
          Time until automatic logout
        </p>
        <p className="text-center mt-2 text-gray-400 text-sm">
          Move mouse or press any key to cancel timer
        </p>
      </div>
    </div>
  )
} 