import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // First check if any admin exists
    const adminCount = await prisma.admin.count()
    
    // If no admins exist, always allow setup
    if (adminCount === 0) {
      return NextResponse.json({ isAllowed: true })
    }

    // Check if any admin has enabled setup
    const admin = await prisma.admin.findFirst({
      where: { isSetupEnabled: true }
    })

    return NextResponse.json({
      isAllowed: !!admin
    })
  } catch (error) {
    console.error('Setup access check error:', error)
    // Default to allowed if database error occurs
    // This prevents lockout in case of database issues
    return NextResponse.json({ isAllowed: true })
  }
} 