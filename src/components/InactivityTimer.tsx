'use client'

import { useEffect, useState, useCallback } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const INITIAL_WARNING_DELAY = 5 * 1000 // Show warning after 5 seconds of inactivity
const WARNING_DISPLAY_TIME = 10 * 1000 // Warning displays for 10 seconds

interface InactivityTimerProps {
  onTimerStart?: () => void
  onTimerReset?: () => void
}

export function InactivityTimer({ onTimerStart, onTimerReset }: InactivityTimerProps) {
  const router = useRouter()
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [showWarning, setShowWarning] = useState(false)
  const [warningOpacity, setWarningOpacity] = useState(0)
  const [hasEnteredTimerPhase, setHasEnteredTimerPhase] = useState(false)

  const resetTimers = useCallback(() => {
    if (!hasEnteredTimerPhase) {
      setLastActivity(Date.now())
      setShowWarning(false)
      setWarningOpacity(0)
      onTimerReset?.()
    }
  }, [hasEnteredTimerPhase, onTimerReset])

  useEffect(() => {
    let warningTimeout: NodeJS.Timeout
    let warningHideTimeout: NodeJS.Timeout
    let timerStartTimeout: NodeJS.Timeout

    const startWarningSequence = () => {
      // Only start warning sequence if we haven't entered timer phase
      if (hasEnteredTimerPhase) return

      // Clear any existing timers
      clearTimeout(warningTimeout)
      clearTimeout(warningHideTimeout)
      clearTimeout(timerStartTimeout)

      // Show warning after initial delay
      warningTimeout = setTimeout(() => {
        if (!hasEnteredTimerPhase) {
          setShowWarning(true)
          setWarningOpacity(1)

          // Start timer after warning display time
          warningHideTimeout = setTimeout(() => {
            setWarningOpacity(0)
            
            // Start timer and hide warning
            timerStartTimeout = setTimeout(() => {
              setShowWarning(false)
              setHasEnteredTimerPhase(true)
              onTimerStart?.()
            }, 500) // Fade out duration
          }, WARNING_DISPLAY_TIME)
        }
      }, INITIAL_WARNING_DELAY)
    }

    const handleActivity = () => {
      const now = Date.now()
      const timeSinceLastActivity = now - lastActivity

      // Debounce rapid events
      if (timeSinceLastActivity < 100) return

      // Only handle activity if we haven't entered timer phase
      if (!hasEnteredTimerPhase) {
        setLastActivity(now)
        resetTimers()
        startWarningSequence()
      }
    }

    // Start initial warning sequence
    if (!hasEnteredTimerPhase) {
      startWarningSequence()
    }

    // Track user activity
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
      clearTimeout(warningTimeout)
      clearTimeout(warningHideTimeout)
      clearTimeout(timerStartTimeout)
    }
  }, [lastActivity, onTimerStart, resetTimers, hasEnteredTimerPhase])

  return (
    <>
      {showWarning && (
        <div className="fixed inset-0 flex items-center justify-center z-[100]">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-500"
            style={{ opacity: warningOpacity }}
          />
          
          {/* Warning Modal */}
          <div 
            className="relative bg-red-600/90 text-white p-10 rounded-2xl shadow-2xl backdrop-blur-sm min-w-[400px] transition-all duration-500 flex flex-col items-center"
            style={{ 
              opacity: warningOpacity,
              transform: `scale(${warningOpacity === 1 ? '1' : '0.95'})`
            }}
          >
            <div className="absolute -top-1 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent" />
            <div className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent" />
            
            <p className="font-semibold text-2xl text-center">
              Inactivity Detected
            </p>
            <p className="text-base mt-4 text-center">
              Please interact with the page to maintain your session
            </p>
            <p className="text-sm mt-2 text-center opacity-80">
              Session timer will start in {Math.ceil(WARNING_DISPLAY_TIME / 1000)} seconds
            </p>
          </div>
        </div>
      )}
    </>
  )
}

// Export timer active state for SessionTimer
export const useSessionTimer = () => {
  const [isActive, setIsActive] = useState(false)
  const resetTimer = () => setIsActive(false)
  return { isActive, resetTimer }
} 