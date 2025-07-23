'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'

const SESSION_DURATION = 5 * 60 // 5 minutes in seconds

export function SessionTimer() {
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION)
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    // Fade in
    setTimeout(() => setOpacity(1), 100)

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          signOut({ redirect: true, callbackUrl: '/login' })
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-500" style={{ opacity }} />
      <div 
        className="relative bg-black/80 text-white p-10 rounded-2xl shadow-2xl backdrop-blur-sm min-w-[400px] transition-all duration-500 flex flex-col items-center"
        style={{ 
          opacity,
          transform: `scale(${opacity === 1 ? '1' : '0.95'})`,
        }}
      >
        <div className="absolute -top-1 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />
        <div className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />
        
        <p className="text-center text-red-500 font-bold text-6xl font-mono tracking-wider mb-2">
          {String(minutes).padStart(2, '0')}
          <span className="text-red-700">:</span>
          {String(seconds).padStart(2, '0')}
        </p>
        <p className="text-center mt-4 text-gray-300">
          Time until automatic logout
        </p>
      </div>
    </div>
  )
} 