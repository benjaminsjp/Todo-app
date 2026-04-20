'use client'

import { useRef, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Camera, Loader2 } from 'lucide-react'

interface AvatarUploadProps {
  currentUrl:   string
  displayName:  string
  onUpload:     (url: string) => void
}

export function AvatarUpload({ currentUrl, displayName, onUpload }: AvatarUploadProps) {
  const inputRef    = useRef<HTMLInputElement>(null)
  const [preview,   setPreview]   = useState(currentUrl)
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Lokal preview umiddelbart
    setPreview(URL.createObjectURL(file))
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res  = await fetch('/api/upload-avatar', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Opplasting feilet')
        setPreview(currentUrl)
        return
      }

      onUpload(data.url)
    } catch {
      setError('Noe gikk galt')
      setPreview(currentUrl)
    } finally {
      setIsLoading(false)
    }
  }

  const initials = displayName
    ? displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar className="size-16">
          <AvatarImage src={preview} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        {/* Overlay ved hover */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isLoading}
          className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
        >
          {isLoading
            ? <Loader2 className="size-4 text-white animate-spin" />
            : <Camera className="size-4 text-white" />
          }
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="flex flex-col gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={isLoading}
        >
          {isLoading ? (
            <><Loader2 className="size-4 animate-spin" /> Uploading...</>
          ) : (
            <><Camera className="size-4" /> Change photo</>
          )}
        </Button>
        {error
          ? <p className="text-xs text-destructive">{error}</p>
          : <p className="text-xs text-muted-foreground">JPG, PNG or GIF · Max 2MB</p>
        }
      </div>
    </div>
  )
}