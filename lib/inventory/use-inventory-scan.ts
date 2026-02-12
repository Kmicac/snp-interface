"use client"

import { useCallback, useState } from 'react'
import { scanInventoryQr } from './utils'
import type { Asset } from './types'

export function useInventoryScan(orgId?: string | null) {
  const [isScanning, setIsScanning] = useState(false)
  const [lastScanned, setLastScanned] = useState<Asset | null>(null)
  const [error, setError] = useState<string | null>(null)

  const scan = useCallback(
    async (qrData: string) => {
      if (!orgId) {
        setError('No organization selected')
        return null
      }

      setIsScanning(true)
      setError(null)

      try {
        const result = await scanInventoryQr(orgId, qrData)
        setLastScanned(result)
        if (!result) {
          setError('Activo no encontrado para este QR')
        }
        return result
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No fue posible escanear el QR')
        return null
      } finally {
        setIsScanning(false)
      }
    },
    [orgId],
  )

  return {
    scan,
    isScanning,
    lastScanned,
    error,
    clearError: () => setError(null),
  }
}
