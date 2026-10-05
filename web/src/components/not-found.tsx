import { Link } from '@tanstack/react-router'
import { SearchIcon } from '@/components/icons'
import { StateMessage } from '@/components/route-error'
import { Button } from '@/components/ui/button'

export function NotFound() {
  return (
    <StateMessage
      icon={<SearchIcon className="size-5" />}
      title="Page not found"
      body="The page you’re looking for doesn’t exist or has moved."
      action={
        <Button size="xs" asChild>
          <Link to="/">Go home</Link>
        </Button>
      }
    />
  )
}
