import { useEffect, useState } from 'react'
import { ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { needsAuthenticatedFetch, resolveImageUrl, toApiPath } from '@/lib/imageUrl'

interface AuthenticatedImageProps {
  src: string
  alt: string
  className?: string
}

export function AuthenticatedImage({ src, alt, className }: AuthenticatedImageProps) {
  const [displaySrc, setDisplaySrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!src) return

    let objectUrl: string | null = null
    let cancelled = false

    const load = async () => {
      setFailed(false)
      setDisplaySrc(null)

      if (!needsAuthenticatedFetch(src)) {
        if (!cancelled) setDisplaySrc(resolveImageUrl(src))
        return
      }

      try {
        const response = await api.get(toApiPath(src), { responseType: 'blob' })
        objectUrl = URL.createObjectURL(response.data)
        if (!cancelled) setDisplaySrc(objectUrl)
      } catch {
        if (!cancelled) {
          setFailed(true)
          setDisplaySrc(resolveImageUrl(src))
        }
      }
    }

    load()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [src])

  if (!displaySrc && !failed) {
    return <div className={cn('bg-muted animate-pulse', className)} aria-hidden />
  }

  if (failed) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 bg-muted text-muted-foreground',
          className
        )}
      >
        <ImageIcon className="h-10 w-10 opacity-40" />
        <span className="text-xs px-4 text-center line-clamp-2">Image unavailable</span>
      </div>
    )
  }

  if (!displaySrc) return null

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  )
}
