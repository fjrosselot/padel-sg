import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'

interface Props {
  imageSrc: string
  open: boolean
  onClose: () => void
  onConfirm: (blob: Blob) => void
}

async function getCroppedBlob(imageSrc: string, croppedArea: Area): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', reject)
    image.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  const size = 400
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  const scaleX = img.naturalWidth / img.width
  const scaleY = img.naturalHeight / img.height

  ctx.drawImage(
    img,
    croppedArea.x * scaleX,
    croppedArea.y * scaleY,
    croppedArea.width * scaleX,
    croppedArea.height * scaleY,
    0, 0, size, size
  )

  return new Promise(resolve => canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.88))
}

export default function AvatarCropModal({ imageSrc, open, onClose, onConfirm }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)
  const [processing, setProcessing] = useState(false)

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels)
  }, [])

  const handleConfirm = async () => {
    if (!croppedArea) return
    setProcessing(true)
    const blob = await getCroppedBlob(imageSrc, croppedArea)
    setProcessing(false)
    onConfirm(blob)
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="font-manrope text-navy">Recortar foto</DialogTitle>
        </DialogHeader>

        <div className="relative w-full" style={{ height: 320, background: '#111' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            minZoom={1}
            maxZoom={6}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="px-5 pb-2 pt-3">
          <label className="font-inter text-xs text-muted block mb-1">Zoom</label>
          <input
            type="range"
            min={1}
            max={6}
            step={0.05}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            className="w-full accent-gold"
          />
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <Button onClick={handleConfirm} disabled={processing} className="flex-1 bg-gold text-navy font-bold">
            {processing ? 'Procesando…' : 'Usar esta foto'}
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
