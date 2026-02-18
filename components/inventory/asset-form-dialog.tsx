"use client"

import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImageUpload } from '@/components/shared/image-upload'
import type { Asset, AssetCategory, AssetCondition, AssetStatus, CreateAssetDto, UpdateAssetDto } from '@/lib/inventory/types'

interface AssetFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode?: 'create' | 'edit'
  initialValues?: Asset | null
  categories: AssetCategory[]
  disabled?: boolean
  isSubmitting?: boolean
  onSubmit: (payload: CreateAssetDto | UpdateAssetDto, imageFile: File | null) => Promise<boolean>
}

const STATUS_OPTIONS: AssetStatus[] = ['IN_STORAGE', 'IN_USE', 'DAMAGED', 'UNDER_REPAIR', 'LOST', 'RETIRED']
const CONDITION_OPTIONS: AssetCondition[] = ['NEW', 'GOOD', 'FAIR', 'POOR', 'BROKEN']

function toInitialValues(initialValues?: Asset | null) {
  return {
    categoryId: initialValues?.categoryId || '',
    name: initialValues?.name || '',
    assetTag: initialValues?.assetTag || '',
    serialNumber: initialValues?.serialNumber || '',
    quantity: initialValues?.quantity ?? 1,
    status: initialValues?.status || ('IN_STORAGE' as AssetStatus),
    condition: initialValues?.condition || ('GOOD' as AssetCondition),
    location: initialValues?.location || '',
    notes: initialValues?.notes || '',
    imageUrl: initialValues?.imageUrl || null,
  }
}

export function AssetFormDialog({
  open,
  onOpenChange,
  mode = 'create',
  initialValues,
  categories,
  disabled,
  isSubmitting,
  onSubmit,
}: AssetFormDialogProps) {
  const [categoryId, setCategoryId] = useState('')
  const [name, setName] = useState('')
  const [assetTag, setAssetTag] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [status, setStatus] = useState<AssetStatus>('IN_STORAGE')
  const [condition, setCondition] = useState<AssetCondition>('GOOD')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const initial = useMemo(() => toInitialValues(initialValues), [initialValues])

  useEffect(() => {
    if (!open) return
    setCategoryId(initial.categoryId)
    setName(initial.name)
    setAssetTag(initial.assetTag)
    setSerialNumber(initial.serialNumber)
    setQuantity(initial.quantity)
    setStatus(initial.status)
    setCondition(initial.condition)
    setLocation(initial.location)
    setNotes(initial.notes)
    setImageFile(null)
    setExistingImageUrl(initial.imageUrl)
    setError(null)
  }, [open, initial])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!name.trim()) {
      setError('El nombre es obligatorio.')
      return
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError('La cantidad debe ser mayor a 0.')
      return
    }

    const payload: CreateAssetDto | UpdateAssetDto = {
      categoryId: categoryId || undefined,
      name: name.trim(),
      assetTag: assetTag || undefined,
      serialNumber: serialNumber || undefined,
      quantity,
      status,
      condition,
      location: location || undefined,
      notes: notes || undefined,
      imageUrl: existingImageUrl || undefined,
    }

    const success = await onSubmit(payload, imageFile)
    if (success) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-[#1F1F23] bg-[#0F0F12] text-white sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Editar Asset' : 'Nuevo Asset'}</DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Actualiza la informacion operativa del activo.'
              : 'Registra un nuevo activo para el modulo de inventario.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="border-[#2B2B30] bg-[#171A22]" />
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoryId || 'none'} onValueChange={(value) => setCategoryId(value === 'none' ? '' : value)}>
                <SelectTrigger className="border-[#2B2B30] bg-[#171A22]">
                  <SelectValue placeholder="Sin categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin categoria</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Asset Tag</Label>
              <Input value={assetTag} onChange={(e) => setAssetTag(e.target.value)} className="border-[#2B2B30] bg-[#171A22]" />
            </div>

            <div className="space-y-2">
              <Label>Serial</Label>
              <Input
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="border-[#2B2B30] bg-[#171A22]"
              />
            </div>

            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                className="border-[#2B2B30] bg-[#171A22]"
              />
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as AssetStatus)}>
                <SelectTrigger className="border-[#2B2B30] bg-[#171A22]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Condicion</Label>
              <Select value={condition} onValueChange={(value) => setCondition(value as AssetCondition)}>
                <SelectTrigger className="border-[#2B2B30] bg-[#171A22]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITION_OPTIONS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ubicacion</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} className="border-[#2B2B30] bg-[#171A22]" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <ImageUpload
                label="Imagen del asset"
                description="Opcional. Sube una foto del activo con drag and drop o seleccion manual."
                value={imageFile}
                onChange={setImageFile}
                existingImageUrl={existingImageUrl}
                onClearExisting={() => setExistingImageUrl(null)}
                maxSizeMB={5}
                disabled={disabled || isSubmitting}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Notas</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="border-[#2B2B30] bg-[#171A22]" />
            </div>
          </div>

          {error ? <p className="text-xs text-red-400">{error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={disabled || isSubmitting}>
              {isSubmitting ? 'Guardando...' : mode === 'edit' ? 'Guardar cambios' : 'Crear asset'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
