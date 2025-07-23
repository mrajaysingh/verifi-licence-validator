'use client'

import { useState, useEffect, useCallback } from 'react'

interface Props {
  onTimerStart: () => void
  onTimerReset: () => void
}

const INACTIVITY_DELAY = 10 * 60 * 1000 // 10 minutes
const WARNING_DURATION = 10 * 1000 // 10 seconds

export function InactivityTimer({ onTimerStart, onTimerReset }: Props) {
  const [showWarning, setShowWarning] = useState(false)
  const [warningOpacity, setWarningOpacity] = useState(0)

  const resetTimers = useCallback(() => {
    setShowWarning(false)
    setWarningOpacity(0)
    onTimerReset()

    // Start inactivity timer
    const inactivityTimer = setTimeout(() => {
      // Show and fade in warning
      setShowWarning(true)
      setTimeout(() => setWarningOpacity(1), 100)

      // Start warning duration timer
      setTimeout(() => {
        // Fade out warning
        setWarningOpacity(0)
        
        // Hide warning and start session timer
        setTimeout(() => {
          setShowWarning(false)
          onTimerStart()
        }, 500) // Fade out duration
      }, WARNING_DURATION)
    }, INACTIVITY_DELAY)

    return () => {
      clearTimeout(inactivityTimer)
    }
  }, [onTimerStart, onTimerReset])

  useEffect(() => {
    // Activity events to monitor
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimers)
    })

    // Initial timer
    const cleanup = resetTimers()

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimers)
      })
      cleanup()
    }
  }, [resetTimers])

  if (!showWarning) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100]">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-500"
        style={{ opacity: warningOpacity }}
      />
      <div 
        className="relative bg-red-600/90 text-white p-10 rounded-2xl shadow-2xl backdrop-blur-sm max-w-md w-full mx-4 transition-all duration-500 flex flex-col items-center"
        style={{ 
          opacity: warningOpacity,
          transform: `scale(${warningOpacity === 1 ? '1' : '0.95'})`
        }}
      >
        <div className="absolute -top-1 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent" />
        <div className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent" />
        
        <h2 className="text-2xl font-bold mb-4">Inactivity Detected</h2>
        <p className="text-center">
          Please interact with the page to maintain your session.
          <br />
          <span className="text-sm opacity-80">
            Session timer will start in {Math.ceil(WARNING_DURATION / 1000)} seconds
          </span>
        </p>
      </div>
    </div>
  )
} 