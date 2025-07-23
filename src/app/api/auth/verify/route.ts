import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { sendVerificationCode } from '@/lib/email'

// Generate a random 8-digit code
function generateVerificationCode(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString()
}

export async function POST(request: Request) {
  try {
    const { email, password, secretKey } = await request.json()

    if (!email || !password || !secretKey) {
      return NextResponse.json(
        { error: 'Email, password and secret key are required' },
        { status: 400 }
      )
    }

    // Find admin by email
    const admin = await prisma.admin.findUnique({
      where: { email }
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify secret key
    if (admin.secretKey !== secretKey) {
      return NextResponse.json(
        { error: 'Invalid secret key' },
        { status: 401 }
      )
    }

    // Generate verification code
    const verificationCode = generateVerificationCode()
    const verificationExpires = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Send verification code via email
    const emailSent = await sendVerificationCode(email, verificationCode)
    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send verification code' },
        { status: 500 }
      )
    }

    // Update admin with verification code
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        verificationCode,
        verificationExpires
      }
    })

    return NextResponse.json({ message: 'Verification code sent' })
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    )
  }
}

// Verify the code
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { email, code } = body

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      )
    }

    const admin = await prisma.admin.findUnique({
      where: { email }
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid verification attempt' },
        { status: 401 }
      )
    }

    if (!admin.verificationCode || !admin.verificationExpires) {
      return NextResponse.json(
        { error: 'No verification code requested' },
        { status: 400 }
      )
    }

    if (admin.verificationExpires < new Date()) {
      return NextResponse.json(
        { error: 'Verification code has expired' },
        { status: 400 }
      )
    }

    if (admin.verificationCode !== code) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 401 }
      )
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

    return NextResponse.json({
      verified: true,
      message: 'Verification successful'
    })
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 