"use client"

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

interface SignaturePadProps {
  disabled?: boolean
  onChange: (dataUrl: string | null) => void
}

export function SignaturePad({ disabled, onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#ffffff'
    ctx.fillStyle = '#11141d'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    onChange(null)
  }, [onChange])

  function getPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const point = getPoint(event)
    if (!ctx || !point) return

    ctx.beginPath()
    ctx.moveTo(point.x, point.y)
    setIsDrawing(true)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing || disabled) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const point = getPoint(event)
    if (!ctx || !point) return

    ctx.lineTo(point.x, point.y)
    ctx.stroke()
  }

  function finishDrawing() {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return

    setIsDrawing(false)
    onChange(canvas.toDataURL('image/png'))
  }

  function clearSignature() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#11141d'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    onChange(null)
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={700}
        height={240}
        className="w-full rounded-md border border-[#2B2B30] bg-[#11141d]"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrawing}
        onPointerLeave={finishDrawing}
      />
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={clearSignature} disabled={disabled}>
          Limpiar firma
        </Button>
      </div>
    </div>
  )
}
