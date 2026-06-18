/** Turn FastAPI `detail` (string or validation array) into user-facing text. */
export function formatApiDetail(detail: unknown, fallback: string): string {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object' && 'msg' in item) {
          return String((item as { msg: string }).msg).replace(/^Value error,\s*/i, '')
        }
        return ''
      })
      .filter(Boolean)
    return messages.join(' ') || fallback
  }
  return fallback
}

export function formatApiError(error: unknown, fallback: string): string {
  const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
  return formatApiDetail(detail, fallback)
}

/** New users must use @sportify.com (matches backend UserCreate rule). */
export function isSportifyCompanyEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase()
  const at = normalized.lastIndexOf('@')
  if (at < 1) return false
  return normalized.slice(at + 1) === 'sportify.com'
}

export const SPORTIFY_EMAIL_ERROR =
  'New users must use a @sportify.com email address. Personal addresses like @gmail.com cannot be used.'
