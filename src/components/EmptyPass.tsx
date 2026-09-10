export function EmptyPass() {
  return (
    <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 text-center">
      <div className="h-px w-24 bg-steel" />
      <p className="font-display text-lg text-paper">The pass is clear.</p>
      <p className="max-w-sm text-sm text-paper/60">
        Nothing is waiting on you. When a ticket goes stale, it lands here first.
      </p>
    </div>
  )
}
