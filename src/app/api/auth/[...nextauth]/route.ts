import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        secretKey: { label: 'Secret Key', type: 'password' },
        otp: { label: 'OTP', type: 'text' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password || !credentials?.secretKey || !credentials?.otp) {
            console.log('Missing credentials:', {
              email: credentials?.email,
              hasPassword: !!credentials?.password,
              hasSecretKey: !!credentials?.secretKey,
              hasOTP: !!credentials?.otp
            })
            throw new Error('All fields are required')
          }

          // Find admin
          const admin = await prisma.admin.findUnique({
            where: { email: credentials.email }
          })

          if (!admin) {
            throw new Error('Invalid credentials')
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(credentials.password, admin.password)
          if (!isValidPassword) {
            throw new Error('Invalid credentials')
          }

          // Verify secret key
          if (credentials.secretKey !== admin.secretKey) {
            throw new Error('Invalid secret key')
          }

          // Verify OTP
          if (!admin.verificationCode || !admin.verificationExpires) {
            throw new Error('No verification code requested')
          }

          if (admin.verificationExpires < new Date()) {
            throw new Error('Verification code has expired')
          }

          if (admin.verificationCode !== credentials.otp) {
            throw new Error('Invalid verification code')
          }

          // Clear verification code and update last login
          await prisma.admin.update({
            where: { id: admin.id },
            data: {
              verificationCode: null,
              verificationExpires: null,
              lastLoginAt: new Date()
            }
          })

          return {
            id: admin.id,
            email: admin.email,
            name: admin.name
          }
        } catch (error) {
          console.error('Authorization error:', error)
          throw error
        }
      }
    })
  ],
  pages: {
    signIn: '/login'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
      }
      return session
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60 // 24 hours
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST } 