import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('Please provide process.env.NEXTAUTH_SECRET')
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        verificationCode: { label: "Verification Code", type: "text" },
        secretKey: { label: "Secret Key", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.verificationCode || !credentials?.secretKey) {
            console.log('Missing credentials:', { 
              email: credentials?.email, 
              code: credentials?.verificationCode,
              hasSecretKey: !!credentials?.secretKey
            })
            throw new Error('Missing credentials')
          }

          console.log('Attempting to verify code:', { email: credentials.email })

          const admin = await prisma.admin.findUnique({
            where: { email: credentials.email }
          })

          if (!admin) {
            console.log('Admin not found:', credentials.email)
            throw new Error('Invalid verification attempt')
          }

          // Verify secret key
          if (admin.secretKey !== credentials.secretKey) {
            console.log('Invalid secret key for:', credentials.email)
            throw new Error('Invalid secret key')
          }

          console.log('Found admin:', { 
            email: admin.email, 
            expectedCode: admin.verificationCode,
            receivedCode: credentials.verificationCode,
            expires: admin.verificationExpires
          })

          if (!admin.verificationCode || !admin.verificationExpires) {
            console.log('No verification code found')
            throw new Error('No verification code requested')
          }

          if (admin.verificationExpires < new Date()) {
            console.log('Code expired')
            throw new Error('Verification code has expired')
          }

          if (admin.verificationCode !== credentials.verificationCode) {
            console.log('Code mismatch:', {
              expected: admin.verificationCode,
              received: credentials.verificationCode
            })
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

          console.log('Verification successful')
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
    signIn: '/login',
    error: '/login'
  },
  session: {
    strategy: 'jwt',
    maxAge: 12 * 60 * 60, // 12 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  jwt: {
    maxAge: 12 * 60 * 60 // 12 hours
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST } 