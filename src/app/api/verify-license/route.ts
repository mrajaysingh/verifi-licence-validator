import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { key, domain } = body

    if (!key) {
      return NextResponse.json(
        { valid: false, message: 'License key is required' },
        { status: 400 }
      )
    }

    const license = await prisma.license.findUnique({
      where: { key }
    })

    if (!license) {
      return NextResponse.json(
        { valid: false, message: 'Invalid license key' },
        { status: 404 }
      )
    }

    if (!license.isActive) {
      return NextResponse.json(
        { valid: false, message: 'License is inactive' },
        { status: 403 }
      )
    }

    if (license.expiresAt && license.expiresAt < new Date()) {
      return NextResponse.json(
        { valid: false, message: 'License has expired' },
        { status: 403 }
      )
    }

    // If domain is provided, check if it matches
    if (domain && license.domain && license.domain !== domain) {
      return NextResponse.json(
        { valid: false, message: 'License is not valid for this domain' },
        { status: 403 }
      )
    }

    // Update activatedAt if not set
    if (!license.activatedAt) {
      await prisma.license.update({
        where: { id: license.id },
        data: { activatedAt: new Date() }
      })
    }

    return NextResponse.json({
      valid: true,
      message: 'License verified successfully',
      expiresAt: license.expiresAt
    })
  } catch (error) {
    console.error('License verification error:', error)
    return NextResponse.json(
      { valid: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 