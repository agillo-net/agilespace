import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/spaces/$spaceSlug')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/spaces/$spaceSlug"!</div>
}
