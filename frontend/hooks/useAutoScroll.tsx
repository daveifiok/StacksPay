import { useEffect, RefObject } from 'react'

export const useAutoScroll = (scrollRef: RefObject<HTMLDivElement>, tabIndex?: number) => {
  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    const scrollHeight = scrollContainer.scrollHeight
    const clientHeight = scrollContainer.clientHeight
    const maxScroll = scrollHeight - clientHeight

    if (maxScroll <= 0) return

    let animationId: number
    let timeoutId: NodeJS.Timeout

    const animateScroll = () => {
      let start = Date.now()
      const downDuration = 2500 // 2.5 seconds to scroll down
      const pauseDuration = 1000 // 1 second pause at bottom
      
      const scrollDown = () => {
        const animate = () => {
          const elapsed = Date.now() - start
          const progress = Math.min(elapsed / downDuration, 1)
          
          // Gentle easing function
          const easeInOutCubic = progress < 0.5 
            ? 4 * progress * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 3) / 2
          
          const scrollTop = easeInOutCubic * maxScroll
          scrollContainer.scrollTop = scrollTop
          
          if (progress < 1) {
            animationId = requestAnimationFrame(animate)
          } else {
            // Pause at bottom, then scroll back
            timeoutId = setTimeout(() => {
              scrollContainer.scrollTo({ 
                top: 0, 
                behavior: 'smooth' 
              })
            }, pauseDuration)
          }
        }
        
        animationId = requestAnimationFrame(animate)
      }

      // Start scroll animation after a delay when tab loads
      timeoutId = setTimeout(scrollDown, 1000)
    }

    // Reset scroll position and start animation
    scrollContainer.scrollTop = 0
    animateScroll()
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [scrollRef, tabIndex]) // Re-run when tab changes

  // Allow manual scrolling to interrupt auto-scroll
  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    let isUserScrolling = false
    let scrollTimeout: NodeJS.Timeout

    const handleScroll = () => {
      isUserScrolling = true
      clearTimeout(scrollTimeout)
      
      // Reset flag after user stops scrolling
      scrollTimeout = setTimeout(() => {
        isUserScrolling = false
      }, 150)
    }

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeout)
    }
  }, [scrollRef])
}