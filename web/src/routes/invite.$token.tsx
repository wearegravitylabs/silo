import { createFileRoute, redirect } from '@tanstack/react-router'

/** Invite-link entry point: start sign-up with the token, which rides along to onboarding's invited flow. */
export const Route = createFileRoute('/invite/$token')({
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/sign-up', search: { invite: params.token } })
  },
})
