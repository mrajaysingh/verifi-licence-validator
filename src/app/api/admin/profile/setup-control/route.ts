import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'

// Get setup control status
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email },
      select: {
        isSetupEnabled: true
      }
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ isSetupEnabled: admin.isSetupEnabled })
  } catch (error) {
    console.error('Setup control fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch setup control status' },
      { status: 500 }
    )
  }
}

// Update setup control
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { isSetupEnabled } = await request.json()

    // Update admin's setup control
    const admin = await prisma.admin.update({
      where: { email: session.user.email },
      data: { isSetupEnabled },
      select: {
        id: true,
        isSetupEnabled: true
      }
    })

    return NextResponse.json(admin)
  } catch (error) {
    console.error('Setup control update error:', error)
    return NextResponse.json(
      { error: 'Failed to update setup control' },
      { status: 500 }
    )
  }
} 