import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

// List all licenses
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const licenses = await prisma.license.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })
    return NextResponse.json(licenses)
  } catch (error) {
    console.error('Error fetching licenses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch licenses' },
      { status: 500 }
    )
  }
}

// Create a new license
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { key, email, domain, expiresAt } = body

    if (!key || !email) {
      return NextResponse.json(
        { error: 'License key and email are required' },
        { status: 400 }
      )
    }

    const existingLicense = await prisma.license.findUnique({
      where: { key }
    })

    if (existingLicense) {
      return NextResponse.json(
        { error: 'License key already exists' },
        { status: 400 }
      )
    }

    const license = await prisma.license.create({
      data: {
        key,
        email,
        domain,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        adminId: session.user.id
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(license, { status: 201 })
  } catch (error) {
    console.error('Error creating license:', error)
    return NextResponse.json(
      { error: 'Failed to create license' },
      { status: 500 }
    )
  }
} 