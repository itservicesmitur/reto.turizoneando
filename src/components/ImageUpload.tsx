import { useState, useRef, type DragEvent, type ChangeEvent } from 'react'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '../config/firebase'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  storagePath: 'stops' | 'prizes'
  label?: string
}

export default function ImageUpload({ value, onChange, storagePath, label }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [manualUrl, setManualUrl] = useState(value)

  const fileInputRef = useRef<HTMLInputElement>(null)

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
      handleUpload(files[0])
    }
  }

  // File change handler (click upload)
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleUpload(files[0])
    }
  }

  // Direct upload logic
  const handleUpload = (file: File) => {
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

    // Clean name
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

  // Clear current image
  const handleRemove = () => {
    onChange('')
    setManualUrl('')
    setError(null)
    setProgress(0)
  }

  // Manual URL apply
  const handleManualUrlApply = () => {
    onChange(manualUrl.trim())
    setManualMode(false)
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
              // Fallback image in case URL is broken
              e.currentTarget.src = 'https://placehold.co/80?text=Error'
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--color-text)',
              marginBottom: 4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {value.split('/').pop()?.split('?')[0] || 'imagen_subida.jpg'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Enlace: {value}
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(230,51,41,0.08)',
              border: 'none',
              color: 'var(--color-red)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              transition: 'background 150ms ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(230,51,41,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(230,51,41,0.08)'}
            title="Eliminar imagen"
          >
            <i className="ri-delete-bin-line" />
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
                <i className="ri-loader-4-line animate-spin" style={{ animation: 'spin-circle 0.8s linear infinite' }} />
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
    </div>
  )
}
