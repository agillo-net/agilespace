import { createFileRoute, Outlet } from '@tanstack/react-router'
import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar'
import { SpaceSidebar } from '@/components/sidebars/space-sidebar'
import { getUserMemberSpace } from '@/lib/supabase/queries'
import { Navbar } from '@/components/navbar'

export const Route = createFileRoute('/space/$slug')({
  component: SpaceLayout,
  loader: async ({ params }) => {
    const { slug } = params

    if (!slug) {
      throw new Error('Space slug is required')
    }

    const { space, isMember } = await getUserMemberSpace(slug)

    if (!space) {
      throw new Error('Space not found')
    }

    if (!isMember) {
      throw new Error('You are not a member of this space')
    }

    return { space }
  }
})

function SpaceLayout() {
  const { space } = Route.useLoaderData()

  return (
    <SidebarProvider defaultOpen>
      <div className="flex flex-1 min-h-screen bg-gray-50">
        <SpaceSidebar space={space} />
        <SidebarInset>
          <div className='container mx-auto py-6 pt-16'>
            <div className="space-4 p-6 relative">
              <Navbar />
              <Outlet />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
