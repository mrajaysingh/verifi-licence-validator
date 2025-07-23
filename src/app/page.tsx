import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function Home() {
  // Check if any admin exists
  const adminCount = await prisma.admin.count()

  // If no admin exists, redirect to setup page
  if (adminCount === 0) {
    redirect('/setup')
  }

  // Otherwise, redirect to login page
  redirect('/login')
}
