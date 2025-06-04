import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/space/$slug')({
  component: RouteComponent,
})

// TODO: Single space logic
function RouteComponent() {
  return <div>Hello "/space/$slug"!</div>
}
