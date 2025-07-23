import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { expiresAt } = await request.json()
    
    if (!expiresAt) {
      return NextResponse.json(
        { error: 'New expiration date is required' },
        { status: 400 }
      )
    }

    const license = await prisma.license.findUnique({
      where: { id: params.id }
    })

    if (!license) {
      return NextResponse.json(
        { error: 'License not found' },
        { status: 404 }
      )
    }

    const updatedLicense = await prisma.license.update({
      where: { id: params.id },
      data: {
        expiresAt: new Date(expiresAt),
        isActive: true // Reactivate license if it was inactive
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

    return NextResponse.json(updatedLicense)
  } catch (error) {
    console.error('Error extending license:', error)
    return NextResponse.json(
      { error: 'Failed to extend license' },
      { status: 500 }
    )
  }
} 