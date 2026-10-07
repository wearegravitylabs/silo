import { LogoMark } from '@/components/logo'
import { Button } from '@/components/ui/button'

export function EmptyState({ portfolioName, onAddAsset }: { portfolioName: string; onAddAsset: () => void }) {
  return (
    <div className="flex flex-1 animate-fade-in-up flex-col items-center justify-center gap-6 px-10 py-20">
      <div className="flex size-20 items-center justify-center rounded-[20px] bg-accent">
        <LogoMark className="h-11 w-10 opacity-50" />
      </div>
      <div className="flex max-w-90 flex-col items-center gap-2 text-center">
        <h2 className="font-heading text-xl leading-7 font-bold">{portfolioName} is empty</h2>
        <p className="leading-5.5 text-muted-foreground">
          Add your first asset or debt to start tracking your net worth, allocation, and financial health over time.
        </p>
      </div>
      <Button onClick={onAddAsset} className="h-9 px-4">
        <PlusIcon />
        Add your first asset
      </Button>
    </div>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" className="size-3.5">
      <path d="M7 2.5v9M2.5 7h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
