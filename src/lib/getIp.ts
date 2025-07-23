import { headers } from 'next/headers'

export function getClientIp(): string {
  const headersList = headers()
  
  const forwardedFor = headersList.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0]
  }

  const realIp = headersList.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  return 'Unknown'
} 