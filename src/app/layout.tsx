import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { NetworkError } from '@/components/NetworkError'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { NextAuthProvider } from '@/components/providers/NextAuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Verifi - License Management',
  description: 'Secure license key management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          <NextAuthProvider>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
              <NetworkError />
              <Toaster position="top-center" />
              {children}
            </div>
          </NextAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
