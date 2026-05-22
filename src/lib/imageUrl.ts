import api from '@/lib/api'

/** Resolve stored image paths to a full URL. */
export function resolveImageUrl(imageUrl: string): string {
  if (!imageUrl) return ''
  if (
    imageUrl.startsWith('data:') ||
    imageUrl.startsWith('blob:') ||
    imageUrl.startsWith('http://') ||
    imageUrl.startsWith('https://')
  ) {
    return imageUrl
  }
  const base = (api.defaults.baseURL || 'http://localhost:8000').replace(/\/$/, '')
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`
  return `${base}${path}`
}

/** True when the image is served by our API (needs Authorization header). */
export function needsAuthenticatedFetch(imageUrl: string): boolean {
  if (!imageUrl) return false
  if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) return false

  const base = api.defaults.baseURL
  if (!base) return imageUrl.startsWith('/')

  try {
    const apiOrigin = new URL(base).origin
    if (imageUrl.startsWith('/')) return true
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return new URL(imageUrl).origin === apiOrigin
    }
    return true
  } catch {
    return imageUrl.startsWith('/')
  }
}

/** Path for axios (relative to baseURL). */
export function toApiPath(imageUrl: string): string {
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    const url = new URL(imageUrl)
    return `${url.pathname}${url.search}`
  }
  return imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`
}

export async function fetchImageBlob(imageUrl: string): Promise<Blob> {
  if (needsAuthenticatedFetch(imageUrl)) {
    const response = await api.get(toApiPath(imageUrl), { responseType: 'blob' })
    return response.data
  }
  const resolved = resolveImageUrl(imageUrl)
  const response = await fetch(resolved)
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`)
  return response.blob()
}
