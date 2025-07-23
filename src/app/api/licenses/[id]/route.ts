import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { key, email, expiresAt } = body

    if (!key || !email || !expiresAt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if key is already used by another license
    const existingLicense = await prisma.license.findFirst({
      where: {
        key,
        NOT: {
          id: params.id
        }
      }
    })

    if (existingLicense) {
      return NextResponse.json(
        { error: 'License key already exists' },
        { status: 400 }
      )
    }

    const license = await prisma.license.update({
      where: { id: params.id },
      data: {
        key,
        email,
        expiresAt: new Date(expiresAt)
      }
    })

    return NextResponse.json(license)
  } catch (error) {
    console.error('License update error:', error)
    return NextResponse.json(
      { error: 'Failed to update license' },
      { status: 500 }
    )
  }
} 