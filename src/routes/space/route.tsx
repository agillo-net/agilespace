import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/space')({
  component: RouteComponent,
})

// TODO: Space layout logic
function RouteComponent() {
  return <div>Hello "/space"!</div>
}
