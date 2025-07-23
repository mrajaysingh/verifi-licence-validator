import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { mkdir } from 'fs/promises'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    
    const username = formData.get('username') as string
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const secretKey = formData.get('secretKey') as string
    const mobileNumber = formData.get('mobileNumber') as string
    const ipAddress = formData.get('ipAddress') as string
    const profileImage = formData.get('profileImage') as File | null

    // Validate required fields
    if (!username || !name || !email || !password || !secretKey || !mobileNumber) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    let profileImagePath = null

    // Handle profile image upload if provided
    if (profileImage) {
      try {
        const bytes = await profileImage.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Create uploads directory if it doesn't exist
        const uploadDir = join(process.cwd(), 'public', 'uploads')
        await mkdir(uploadDir, { recursive: true })

        // Generate unique filename
        const uniqueFilename = `${Date.now()}-${profileImage.name}`
        const imagePath = join(uploadDir, uniqueFilename)
        
        // Save file
        await writeFile(imagePath, buffer)
        
        // Store relative path in database
        profileImagePath = `/uploads/${uniqueFilename}`
      } catch (error) {
        console.error('Error uploading profile image:', error)
        return NextResponse.json(
          { error: 'Failed to upload profile image' },
          { status: 500 }
        )
      }
    }

    // Create admin in database
    const admin = await prisma.admin.create({
      data: {
        username,
        name,
        email,
        password: hashedPassword,
        secretKey,
        mobileNumber,
        lastKnownIp: ipAddress,
        profileImage: profileImagePath,
        isSetupEnabled: true // Set default to enabled
      }
    })

    // Remove sensitive data before sending response
    const { password: pwd, secretKey: key, ...safeAdminData } = admin

    return NextResponse.json(safeAdminData)
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { error: 'Failed to create admin account' },
      { status: 500 }
    )
  }
} 