/**
 * Generates a random license key in the format: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX
 * Using only uppercase letters and numbers
 */
export function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const segments = 5
  const segmentLength = 5
  
  const generateSegment = () => {
    return Array.from(
      { length: segmentLength }, 
      () => chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('')
  }

  return Array.from(
    { length: segments },
    generateSegment
  ).join('-')
} 