import { useEffect, useRef, type ReactNode } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'

export function Dialog({
  open,
  onOpenChange,
  trigger,
  title,
  children,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: ReactNode
  title: string
  children: ReactNode
}) {
  const openedAt = useRef(0)
  useEffect(() => {
    if (open) openedAt.current = Date.now()
  }, [open])

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? (
        <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      ) : null}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70" />
        <DialogPrimitive.Content
          className={cn(
            'fixed top-1/2 left-1/2 z-[60] w-[min(520px,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-steel bg-field-2 p-6 text-paper shadow-2xl relative',
          )}
          onPointerDownOutside={(event) => {
            if (Date.now() - openedAt.current < 400) event.preventDefault()
          }}
          onInteractOutside={(event) => {
            if (Date.now() - openedAt.current < 400) event.preventDefault()
          }}
        >
          <DialogPrimitive.Title className="font-display text-xl font-semibold">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Ticket actions
          </DialogPrimitive.Description>
          <div className="mt-4">{children}</div>
          <DialogPrimitive.Close className="absolute top-3 right-3 text-paper/50 hover:text-paper">
            Close
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

