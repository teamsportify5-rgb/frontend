import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"
import { formatApiDetail } from "@/lib/apiError"

function toastDescriptionText(description: unknown): string | null {
  if (description == null) return null
  if (typeof description === "string") return description
  if (typeof description === "number") return String(description)
  return formatApiDetail(description, "Something went wrong")
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const descriptionText = toastDescriptionText(description)
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {descriptionText && (
                <ToastDescription>{descriptionText}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}




