'use client'

import { useEffect, useRef } from 'react'

interface AnimatedMeshGradientProps {
  className?: string
}

export default function AnimatedMeshGradient({ className = '' }: AnimatedMeshGradientProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const isVisibleRef = useRef(true)
  const mouseRef = useRef({ x: 0.5, y: 0.5 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let time = 0
    const points = [
      { x: 0.2, y: 0.3, speed: 0.002, radius: 0.8 },
      { x: 0.8, y: 0.2, speed: 0.003, radius: 0.6 },
      { x: 0.3, y: 0.8, speed: 0.0025, radius: 0.7 },
      { x: 0.7, y: 0.7, speed: 0.0015, radius: 0.9 },
      { x: 0.5, y: 0.5, speed: 0.002, radius: 0.5 }
    ]

    // Resize canvas to fit container
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      
      // Ensure we have valid dimensions
      const width = rect.width || window.innerWidth
      const height = rect.height || window.innerHeight
      
      canvas.width = width
      canvas.height = height
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'
    }

    // Noise function for organic movement - enhanced for better visibility
    const noise = (x: number, y: number, time: number) => {
      return Math.sin(x * 4 + time) * Math.cos(y * 3 + time * 0.7) * 0.15 +
             Math.sin(x * 2 + time * 1.3) * Math.cos(y * 5 + time * 0.5) * 0.08
    }

    // Create radial gradient
    const createGradient = (x: number, y: number, radius: number, colors: string[]) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
      colors.forEach((color, index) => {
        gradient.addColorStop(index / (colors.length - 1), color)
      })
      return gradient
    }

    // Animation loop
    const animate = () => {
      if (!isVisibleRef.current) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }

      const width = canvas.width
      const height = canvas.height

      // Clear canvas with base background
      ctx.fillStyle = '#0A0A0B'
      ctx.fillRect(0, 0, width, height)

      // Set blend mode for gradient mixing
      ctx.globalCompositeOperation = 'screen'

      // Draw animated gradient points with mouse influence
      points.forEach((point, index) => {
        // Add subtle mouse influence
        const mouseInfluence = 0.1
        const mouseX = mouseRef.current.x * mouseInfluence
        const mouseY = mouseRef.current.y * mouseInfluence
        
        const x = width * (point.x + noise(point.x, point.y, time * point.speed) + mouseX * 0.1)
        const y = height * (point.y + noise(point.y, point.x, time * point.speed * 1.1) + mouseY * 0.1)
        const radius = Math.min(width, height) * point.radius * (1 + Math.sin(time * point.speed * 2) * 0.2)

        let colors: string[]
        switch (index) {
          case 0:
            colors = ['rgba(220, 38, 38, 0.6)', 'rgba(220, 38, 38, 0.3)', 'rgba(220, 38, 38, 0.1)', 'rgba(0, 0, 0, 0)']
            break
          case 1:
            colors = ['rgba(80, 80, 90, 0.5)', 'rgba(60, 60, 70, 0.3)', 'rgba(40, 40, 50, 0.1)', 'rgba(0, 0, 0, 0)']
            break
          case 2:
            colors = ['rgba(180, 30, 30, 0.4)', 'rgba(140, 25, 25, 0.2)', 'rgba(100, 20, 20, 0.1)', 'rgba(0, 0, 0, 0)']
            break
          case 3:
            colors = ['rgba(120, 120, 130, 0.4)', 'rgba(80, 80, 90, 0.2)', 'rgba(50, 50, 60, 0.1)', 'rgba(0, 0, 0, 0)']
            break
          default:
            colors = ['rgba(160, 40, 40, 0.35)', 'rgba(120, 30, 30, 0.2)', 'rgba(80, 20, 20, 0.1)', 'rgba(0, 0, 0, 0)']
        }

        ctx.fillStyle = createGradient(x, y, radius, colors)
        ctx.fillRect(0, 0, width, height)
      })

      // Add subtle overlay gradients
      ctx.globalCompositeOperation = 'multiply'
      
      // Top to bottom gradient
      const topGradient = ctx.createLinearGradient(0, 0, 0, height)
      topGradient.addColorStop(0, 'rgba(20, 20, 21, 0.3)')
      topGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)')
      topGradient.addColorStop(1, 'rgba(10, 10, 11, 0.4)')
      ctx.fillStyle = topGradient
      ctx.fillRect(0, 0, width, height)

      ctx.globalCompositeOperation = 'source-over'

      time += 3  // Increased speed for better visibility
      animationRef.current = requestAnimationFrame(animate)
    }

    // Viewport observer for performance
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          isVisibleRef.current = entry.isIntersecting
        }
      },
      { threshold: 0.1 }
    )

    // Mouse move handler
    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: (event.clientX - rect.left) / rect.width,
        y: (event.clientY - rect.top) / rect.height
      }
    }

    // Initialize with delay to ensure container has dimensions
    const init = () => {
      resizeCanvas()
      observer.observe(canvas)
      animate()
    }
    
    // Use setTimeout to ensure container is rendered
    const timeoutId = setTimeout(init, 100)

    // Event listeners
    window.addEventListener('resize', resizeCanvas)
    canvas.addEventListener('mousemove', handleMouseMove)

    // Cleanup
    return () => {
      clearTimeout(timeoutId)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      observer.disconnect()
      window.removeEventListener('resize', resizeCanvas)
      canvas.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ /* filter: 'blur(1px)' - removed for testing visibility */ }}
    />
  )
}