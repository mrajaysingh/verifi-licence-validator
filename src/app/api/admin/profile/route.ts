import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import bcrypt from 'bcryptjs'

// Get admin profile
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
        id: true,
        username: true,
        name: true,
        email: true,
        profileImage: true,
        mobileNumber: true,
        lastKnownIp: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(admin)
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// Update admin profile
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      name,
      username,
      mobileNumber,
      currentPassword,
      newPassword
    } = body

    // Get current admin
    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email }
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      )
    }

    // Check if username is taken by another admin
    if (username !== admin.username) {
      const existingAdmin = await prisma.admin.findUnique({
        where: { username }
      })
      if (existingAdmin) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      name,
      username,
      mobileNumber
    }

    // Handle password change
    if (currentPassword && newPassword) {
      const isValidPassword = await bcrypt.compare(currentPassword, admin.password)
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        )
      }
      updateData.password = await bcrypt.hash(newPassword, 10)
    }

    // Update admin
    const updatedAdmin = await prisma.admin.update({
      where: { email: session.user.email },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        profileImage: true,
        mobileNumber: true,
        lastKnownIp: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(updatedAdmin)
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
} 