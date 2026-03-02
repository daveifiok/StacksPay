'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navbar from './Navbar'

export default function ConditionalNavbar() {
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null // Return null during SSR and initial hydration
  }
  
  if (pathname?.startsWith('/dashboard')
      || pathname?.startsWith('/login')
      || pathname?.startsWith('/register')
      || pathname?.startsWith('/checkout')) {
    return null
  }
  
  return <Navbar />
}
