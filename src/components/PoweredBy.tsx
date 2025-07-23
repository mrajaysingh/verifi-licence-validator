'use client'

import Image from 'next/image'

interface PoweredByProps {
  className?: string
}

export function PoweredBy({ className = '' }: PoweredByProps) {
  return (
    <div className={`flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 ${className}`}>
      <span>Powered by</span>
      <Image
        src="https://amritanam-s3-bucket.s3.ap-south-1.amazonaws.com/Matron/sponser-favicon.svg"
        alt="SKYBER"
        width={24}
        height={24}
        // className="dark:invert"
      />
      <span>SKYBER</span>
    </div>
  )
} 