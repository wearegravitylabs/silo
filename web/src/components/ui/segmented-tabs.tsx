import * as React from 'react'
import { Tabs as TabsPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

/** Tabs drawn as a segmented control: grey track, the active tab a raised white pill. */
const SegmentedTabs = TabsPrimitive.Root

function SegmentedTabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List className={cn('flex h-8 items-stretch rounded-lg bg-accent p-0.5', className)} {...props} />
}

function SegmentedTabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'flex flex-1 items-center justify-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground transition-[background-color,color,box-shadow] outline-none',
        'hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40',
        'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-small',
        '[&_svg]:size-3.5',
        className,
      )}
      {...props}
    />
  )
}

const SegmentedTabsContent = TabsPrimitive.Content

export { SegmentedTabs, SegmentedTabsContent, SegmentedTabsList, SegmentedTabsTrigger }
