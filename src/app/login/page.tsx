'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const { status } = useSession()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'credentials' | 'verification'>('credentials')
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    secretKey: '',
    code: ''
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/admin')
    }
  }, [status, router])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f] p-4">
        <div className="h-8 w-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email || !formData.password || !formData.secretKey) {
      toast.error('Please enter your email, password and secret key')
      return
    }

    try {
      setLoading(true)
      console.log('Requesting verification code for:', formData.email)

      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          secretKey: formData.secretKey
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limit error - show message but stay on verification step
          toast.error(data.error)
          setTimeLeft(data.timeLeft || 60)
          setStep('verification')
        } else {
          throw new Error(data.error || 'Failed to send verification code')
        }
        return
      }

      console.log('Verification code sent successfully')
      toast.success('Verification code sent to your email')
      setStep('verification')
      setTimeLeft(60) // Start 60-second countdown
      // Clear any existing code when requesting a new one
      setFormData(prev => ({ ...prev, code: '' }))
    } catch (error) {
      console.error('Verification request error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send verification code')
      // Stay on credentials step if there's an error
      setStep('credentials')
    } finally {
      setLoading(false)
    }
  }

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.code || formData.code.length !== 8) {
      toast.error('Please enter a valid 8-digit code')
      return
    }

    try {
      setLoading(true)
      console.log('Attempting to verify code for:', formData.email)

      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        verificationCode: formData.code,
        secretKey: formData.secretKey
      })

      console.log('Sign in result:', result)

      if (result?.error) {
        throw new Error(result.error)
      }

      if (!result?.ok) {
        throw new Error('Authentication failed')
      }

      console.log('Login successful')
      toast.success('Login successful')
      router.push('/admin')
      router.refresh()
    } catch (error) {
      console.error('Verification error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Verification failed'
      toast.error(errorMessage)
      
      if (errorMessage.includes('expired')) {
        toast.error('Verification code expired. Please request a new one.')
        setStep('credentials')
      } else if (errorMessage.includes('Invalid verification code')) {
        // Clear the code field on invalid attempts
        setFormData(prev => ({ ...prev, code: '' }))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!formData.email || !formData.password || !formData.secretKey) {
      toast.error('Missing credentials for resending code')
      setStep('credentials')
      return
    }

    if (timeLeft > 0) {
      toast.error(`Please wait ${timeLeft} seconds before requesting a new code`)
      return
    }

    try {
      setLoading(true)
      console.log('Resending verification code for:', formData.email)

      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          secretKey: formData.secretKey
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limit error
          toast.error(data.error)
          setTimeLeft(data.timeLeft || 60)
        } else {
          throw new Error(data.error || 'Failed to resend code')
        }
        return
      }

      console.log('New verification code sent successfully')
      toast.success('New verification code sent to your email')
      setFormData(prev => ({ ...prev, code: '' }))
      setTimeLeft(60) // Reset timer
    } catch (error) {
      console.error('Resend code error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to resend code')
      if (error instanceof Error && (error.message.includes('Invalid') || error.message.includes('expired'))) {
        setStep('credentials')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f] p-4">
      <div className="w-full max-w-md">
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-center mb-8 text-white">Admin Login</h2>
          {step === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-6" autoComplete="off">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email_nofill"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-white"
                  placeholder="admin@example.com"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password_nofill"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-white"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
              </div>
              <div>
                <label htmlFor="secretKey" className="block text-sm font-medium text-gray-200 mb-2">
                  Secret Key
                </label>
                <input
                  id="secretKey"
                  name="secretKey"
                  type="password"
                  required
                  value={formData.secretKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, secretKey: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-white"
                  placeholder="Enter secret key"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !formData.email || !formData.password || !formData.secretKey}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 px-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Send Verification Code'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerificationSubmit} className="space-y-6">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-200 mb-2">
                  Verification Code
                </label>
                <input
                  id="code"
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 8)
                    setFormData(prev => ({ ...prev, code: value }))
                  }}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-white tracking-widest text-center text-2xl"
                  placeholder="12345678"
                  maxLength={8}
                  pattern="\d{8}"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                />
                <div className="mt-2 text-sm text-gray-400 text-center space-y-1">
                  <p>Enter the 8-digit code sent to {formData.email}</p>
                  {timeLeft > 0 && (
                    <p className="text-blue-400">
                      Resend code in {timeLeft} seconds
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading || formData.code.length !== 8}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 px-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Verify & Login'
                  )}
                </button>
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setStep('credentials')}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    ← Back to Login
                  </button>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={loading || timeLeft > 0}
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                  >
                    Resend Code
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
} 