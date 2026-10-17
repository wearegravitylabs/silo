import type { ReactNode } from 'react'
import { MailIcon, MonitorIcon } from 'lucide-react'
import { toast } from 'sonner'
import { SettingHeading } from '@/components/setting-row'
import { ToggleCard } from '@/components/toggle-card'
import { Skeleton } from '@/components/ui/skeleton'
import { useNotificationChannels, useUpdateNotificationChannels } from '../queries'
import type { NotificationChannels } from '../types'

const CHANNELS: { key: keyof NotificationChannels; title: string; icon: ReactNode }[] = [
  { key: 'email', title: 'Email', icon: <MailIcon /> },
  { key: 'in_app', title: 'In app', icon: <MonitorIcon /> },
]

/** Body of Settings → Notifications (inside <SettingsPage>): one switch per channel, saved as it's flipped. */
export function NotificationSettings() {
  const { data: channels } = useNotificationChannels()
  const update = useUpdateNotificationChannels()

  return (
    <section className="flex flex-col gap-3">
      <SettingHeading title="Notification Channel" description="Choose how you want to be notified" />
      {CHANNELS.map(({ key, title, icon }) =>
        channels ? (
          <ToggleCard
            key={key}
            icon={icon}
            title={title}
            checked={channels[key]}
            onCheckedChange={(on) =>
              update.mutate({ [key]: on }, { onError: () => toast.error(`Couldn’t update ${title.toLowerCase()} notifications`) })
            }
          />
        ) : (
          <Skeleton key={key} className="h-18 rounded-xl" />
        ),
      )}
    </section>
  )
}
