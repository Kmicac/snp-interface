"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { AssetQrResponse } from '@/lib/inventory/types'

interface AssetQrDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assetName?: string
  assetTag?: string | null
  assetStatus?: string | null
  qrData: AssetQrResponse | null
  isLoading?: boolean
  error?: string | null
}

export function AssetQrDialog({ open, onOpenChange, assetName, assetTag, assetStatus, qrData, isLoading, error }: AssetQrDialogProps) {
  const fallbackImage = qrData?.qrContent
    ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(qrData.qrContent)}`
    : null

  const imageUrl = qrData?.qrImage || fallbackImage

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[#1F1F23] bg-[#0F0F12] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR del Asset</DialogTitle>
          <DialogDescription>{assetName || 'Activo'} - Escanea para identificar y registrar movimientos.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {isLoading ? (
            <div className="flex h-72 items-center justify-center rounded-lg border border-[#2B2B30] bg-[#171A22] text-sm text-gray-400">
              Generando QR...
            </div>
          ) : null}

          {!isLoading && error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
          ) : null}

          {!isLoading && !error && imageUrl ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-[#2B2B30] bg-[#171A22] p-4">
              <img src={imageUrl} alt="QR Asset" className="h-72 w-72 rounded bg-white p-2" />
              <div className="w-full rounded-md border border-[#2B2B30] bg-[#0F0F12] p-3 text-xs text-gray-300">
                <p>
                  <span className="text-gray-500">Nombre:</span> {assetName || "-"}
                </p>
                <p>
                  <span className="text-gray-500">Tag/SKU:</span> {assetTag || "-"}
                </p>
                <p>
                  <span className="text-gray-500">Estado:</span> {assetStatus || "-"}
                </p>
              </div>
              <p className="w-full break-all text-xs text-gray-400">{qrData?.qrContent}</p>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
