import { useState, useRef, type DragEvent, type ChangeEvent } from 'react'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '../config/firebase'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  storagePath: 'stops' | 'prizes' | 'admins' | 'locals'
  label?: string
}

interface CropConfig {
  aspectRatio: number
  outputWidth: number
  outputHeight: number
  cropWidth: number
  cropHeight: number
}

export default function ImageUpload({ value, onChange, storagePath, label }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [manualUrl, setManualUrl] = useState(value)

  // Cropper State
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState('')
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [zoom, setZoom] = useState(1.0)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [imgDimensions, setImgDimensions] = useState({
    width: 0,
    height: 0,
    naturalWidth: 0,
    naturalHeight: 0
  })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Config based on path
  const getCropConfig = (path: typeof storagePath): CropConfig => {
    switch (path) {
      case 'prizes':
        return { aspectRatio: 1, outputWidth: 600, outputHeight: 600, cropWidth: 280, cropHeight: 280 }
      case 'admins':
        return { aspectRatio: 1, outputWidth: 400, outputHeight: 400, cropWidth: 280, cropHeight: 280 }
      case 'stops':
      case 'locals':
      default:
        return { aspectRatio: 4 / 3, outputWidth: 800, outputHeight: 600, cropWidth: 320, cropHeight: 240 }
    }
  }

  const config = getCropConfig(storagePath)

  // Drag over handler
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  // Drag leave handler
  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  // Drop handler
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      initiateCropFlow(files[0])
    }
  }

  // File change handler (click upload)
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      initiateCropFlow(files[0])
    }
  }

  // Initiate crop modal flow
  const initiateCropFlow = (file: File) => {
    setError(null)

    // Validate type
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecciona un archivo de imagen válido (PNG, JPG, WEBP, etc.)')
      return
    }

    // Validate size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setError('El tamaño de la imagen no debe superar los 5 MB')
      return
    }

    setOriginalFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      setCropImageSrc(reader.result as string)
      setCropModalOpen(true)
    }
    reader.readAsDataURL(file)
  }

  // Actual upload logic
  const startUpload = (file: File) => {
    setError(null)
    const extension = file.name.split('.').pop() || 'jpg'
    const uniqueFilename = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${extension}`
    const storageRef = ref(storage, `${storagePath}/${uniqueFilename}`)
    const uploadTask = uploadBytesResumable(storageRef, file)

    setUploading(true)
    setProgress(0)

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
        setProgress(percent)
      },
      (err) => {
        console.error('Firebase Storage upload error:', err)
        setError(`Error al subir imagen: ${err.message}`)
        setUploading(false)
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref)
          onChange(downloadUrl)
          setManualUrl(downloadUrl)
        } catch (err) {
          console.error('Failed to get download URL:', err)
          setError('No se pudo obtener el enlace de descarga de la imagen.')
        } finally {
          setUploading(false)
        }
      }
    )
  }

  // Trigger input selection click
  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Manual URL apply
  const handleManualUrlApply = () => {
    onChange(manualUrl.trim())
    setManualMode(false)
  }

  // Image load details inside crop viewport
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const natW = img.naturalWidth
    const natH = img.naturalHeight

    let baseW = 0
    let baseH = 0

    if (natW / natH > config.cropWidth / config.cropHeight) {
      baseH = config.cropHeight
      baseW = config.cropHeight * (natW / natH)
    } else {
      baseW = config.cropWidth
      baseH = config.cropWidth * (natH / natW)
    }

    setImgDimensions({
      width: baseW,
      height: baseH,
      naturalWidth: natW,
      naturalHeight: natH
    })

    setZoom(1.0)
    setOffset({ x: 0, y: 0 })
  }

  // Constraint math
  const constrainOffset = (x: number, y: number, currentZoom: number) => {
    if (!imgDimensions.width || !imgDimensions.height) return { x: 0, y: 0 }

    const wZoom = imgDimensions.width * currentZoom
    const hZoom = imgDimensions.height * currentZoom

    const xMax = Math.max(0, (wZoom - config.cropWidth) / 2)
    const yMax = Math.max(0, (hZoom - config.cropHeight) / 2)

    return {
      x: Math.min(xMax, Math.max(-xMax, x)),
      y: Math.min(yMax, Math.max(-yMax, y))
    }
  }

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y
    setOffset(constrainOffset(newX, newY, zoom))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Touch handlers for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return
    setIsDragging(true)
    const touch = e.touches[0]
    setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return
    const touch = e.touches[0]
    const newX = touch.clientX - dragStart.x
    const newY = touch.clientY - dragStart.y
    setOffset(constrainOffset(newX, newY, zoom))
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom)
    setOffset(prev => constrainOffset(prev.x, prev.y, newZoom))
  }

  // Apply Crop
  const handleCropApply = () => {
    if (!imgDimensions.naturalWidth || !imgDimensions.naturalHeight || !originalFile) return

    const img = new Image()
    img.src = cropImageSrc
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = config.outputWidth
      canvas.height = config.outputHeight
      const ctx = canvas.getContext('2d')

      if (ctx) {
        const scaleFactor = config.outputWidth / config.cropWidth

        const wZoom = imgDimensions.width * zoom
        const hZoom = imgDimensions.height * zoom

        const wDraw = wZoom * scaleFactor
        const hDraw = hZoom * scaleFactor

        const xDraw = ((config.cropWidth - wZoom) / 2 + offset.x) * scaleFactor
        const yDraw = ((config.cropHeight - hZoom) / 2 + offset.y) * scaleFactor

        // Clean background
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, config.outputWidth, config.outputHeight)

        ctx.drawImage(img, xDraw, yDraw, wDraw, hDraw)

        canvas.toBlob((blob) => {
          if (blob) {
            const filename = originalFile.name.replace(/\.[^/.]+$/, '') + '_cropped.jpg'
            const croppedFile = new File([blob], filename, { type: 'image/jpeg' })
            setCropModalOpen(false)
            startUpload(croppedFile)
          }
        }, 'image/jpeg', 0.75)
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
            {label}
          </span>
          <button
            type="button"
            onClick={() => {
              setManualMode(!manualMode)
              setManualUrl(value)
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-navy)',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0
            }}
          >
            {manualMode ? 'Volver a Subida' : 'Editar URL manualmente'}
          </button>
        </div>
      )}

      {manualMode ? (
        // Mode 1: Manual Input Text URL
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="url"
            placeholder="https://ejemplo.com/imagen.jpg"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            style={{
              flex: 1,
              height: 40,
              borderRadius: 8,
              border: '1.5px solid var(--color-border)',
              padding: '0 12px',
              fontSize: 14,
              fontFamily: 'var(--font-body)',
              outline: 'none'
            }}
          />
          <button
            type="button"
            onClick={handleManualUrlApply}
            style={{
              height: 40,
              padding: '0 14px',
              borderRadius: 8,
              background: 'var(--color-navy)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Aplicar
          </button>
        </div>
      ) : value ? (
        // Mode 2: Already has an Image / Preview State
        <div style={{
          position: 'relative',
          borderRadius: 12,
          border: '1.5px solid var(--color-border)',
          overflow: 'hidden',
          background: 'var(--color-gray-light)',
          display: 'flex',
          alignItems: 'center',
          padding: 12,
          gap: 16
        }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <img
            src={value}
            alt="Preview"
            style={{
              width: 80,
              height: 80,
              borderRadius: 8,
              objectFit: 'cover',
              border: '1.5px solid var(--color-border)',
              background: '#fff'
            }}
            onError={(e) => {
              e.currentTarget.src = 'https://placehold.co/80?text=Error'
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            {uploading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="ri-loader-4-line" style={{ animation: 'spin-circle 0.8s linear infinite' }} />
                  Subiendo ({progress}%)
                </div>
                <div style={{ width: '100%', height: 5, borderRadius: 3, background: 'rgba(27,43,110,0.1)', overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-navy) 0%, var(--color-teal) 100%)', borderRadius: 3, transition: 'width 150ms ease-out' }} />
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {value.split('/').pop()?.split('?')[0] || 'imagen_subida.jpg'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Enlace: {value}
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={triggerFileSelect}
            disabled={uploading}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(27,43,110,0.07)',
              border: 'none',
              color: 'var(--color-navy)',
              cursor: uploading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 17,
              transition: 'background 150ms ease',
              opacity: uploading ? 0.5 : 1,
            }}
            onMouseEnter={e => { if (!uploading) e.currentTarget.style.background = 'rgba(27,43,110,0.14)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(27,43,110,0.07)' }}
            title="Cambiar imagen"
          >
            <i className="ri-pencil-line" />
          </button>
        </div>
      ) : (
        // Mode 3: Drag & Drop Zone
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileSelect}
          style={{
            height: 120,
            borderRadius: 12,
            border: `2px dashed ${isDragOver ? 'var(--color-navy)' : 'var(--color-border)'}`,
            background: isDragOver ? 'rgba(27,43,110,0.02)' : 'var(--color-surface)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 16,
            textAlign: 'center',
            transition: 'border-color 150ms ease, background 150ms ease',
            position: 'relative'
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: 'none' }}
          />

          {uploading ? (
            // Uploading State
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%', maxWidth: 240 }}>
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--color-navy)',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <i className="ri-loader-4-line" style={{ animation: 'spin-circle 0.8s linear infinite' }} />
                Subiendo archivo ({progress}%)
              </div>
              <div style={{
                width: '100%',
                height: 6,
                borderRadius: 3,
                background: 'rgba(27,43,110,0.1)',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--color-navy) 0%, var(--color-teal) 100%)',
                  borderRadius: 3,
                  transition: 'width 150ms ease-out'
                }} />
              </div>
            </div>
          ) : (
            // Idle State
            <>
              <i className="ri-upload-cloud-2-line" style={{
                fontSize: 28,
                color: isDragOver ? 'var(--color-navy)' : 'var(--color-gray-mid)',
                marginBottom: 8
              }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>
                Arrastra una imagen aquí o <span style={{ color: 'var(--color-navy)', textDecoration: 'underline' }}>búscala en tu equipo</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                Formatos recomendados: PNG, JPG, WEBP (Max. 5MB)
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <div style={{
          fontSize: 12,
          color: 'var(--color-error)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginTop: 2
        }}>
          <i className="ri-error-warning-line" />
          {error}
        </div>
      )}

      {/* ── CROP INTERACTIVE MODAL ── */}
      {cropModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(3, 31, 38, 0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          fontFamily: 'var(--font-body)'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 24,
            width: '90%',
            maxWidth: 440,
            padding: 24,
            boxShadow: '0 24px 64px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: 20
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--color-navy)', fontFamily: 'var(--font-display)' }}>
                  Ajustar Imagen
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: 11, color: 'var(--color-text-muted)' }}>
                  Arrastra para posicionar y usa la barra inferior para hacer zoom
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCropModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-gray-mid)',
                  fontSize: 22,
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <i className="ri-close-line" />
              </button>
            </div>

            {/* Viewport Frame */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: '#f4f5f7',
              borderRadius: 16,
              padding: 20,
              border: '1px solid var(--color-border)'
            }}>
              <div
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                  width: config.cropWidth,
                  height: config.cropHeight,
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: storagePath === 'admins' ? '50%' : 12,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 0 0 2px var(--color-navy)',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  userSelect: 'none',
                  background: '#ffffff'
                }}
              >
                <img
                  src={cropImageSrc}
                  alt="Crop Target"
                  onLoad={handleImageLoad}
                  style={{
                    position: 'absolute',
                    width: imgDimensions.width || '100%',
                    height: imgDimensions.height || '100%',
                    left: imgDimensions.width ? (config.cropWidth - imgDimensions.width) / 2 : 0,
                    top: imgDimensions.height ? (config.cropHeight - imgDimensions.height) / 2 : 0,
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                    transformOrigin: 'center center',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    display: cropImageSrc ? 'block' : 'none'
                  }}
                />
              </div>
            </div>

            {/* Zoom Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <i className="ri-zoom-out-line" style={{ color: 'var(--color-gray-mid)', fontSize: 16 }} />
              <input
                type="range"
                min="1.0"
                max="3.0"
                step="0.01"
                value={zoom}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 3,
                  background: 'var(--color-border)',
                  outline: 'none',
                  cursor: 'pointer',
                  accentColor: 'var(--color-navy)'
                }}
              />
              <i className="ri-zoom-in-line" style={{ color: 'var(--color-navy)', fontSize: 16 }} />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={() => setCropModalOpen(false)}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 12,
                  border: '1.5px solid var(--color-border)',
                  background: '#ffffff',
                  color: 'var(--color-text-muted)',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCropApply}
                style={{
                  flex: 2,
                  height: 44,
                  borderRadius: 12,
                  border: 'none',
                  background: 'var(--color-navy)',
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(27,43,110,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <i className="ri-crop-line" />
                Recortar y Subir
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin-circle { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
