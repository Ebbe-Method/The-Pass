import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-steel px-2 py-0.5 font-clock text-[11px] uppercase tracking-[0.14em] text-paper-2',
        className,
      )}
      {...props}
    />
  )
}
