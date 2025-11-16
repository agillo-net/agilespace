import { createFileRoute, Outlet } from '@tanstack/react-router'
import {
  SidebarInset,
} from '@/components/ui/sidebar'
import { SpaceSidebar } from '@/components/sidebars/space-sidebar'
import { getUserMemberSpace } from '@/lib/supabase/queries'
import { getOrganizationById } from '@/lib/github/queries'
import { Navbar } from '@/components/navbar'
import { CreateIssueDialog } from '@/components/create-issue-dialog'
import { useCreateIssueDialog } from '@/hooks/api/use-create-issue-dialog'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'

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
  // Use the hook only once at the top level
  const { open, setOpen } = useCreateIssueDialog()

  // Fetch organization data to get the login
  const { data: organization } = useQuery({
    queryKey: queryKeys.organizations.byGithubId(space.github_org_id),
    queryFn: () => space.github_org_id ? getOrganizationById(space.github_org_id) : null,
    enabled: !!space.github_org_id,
  })

  return (
    <>
      <Navbar createIssueOpen={open} setCreateIssueOpen={setOpen} organizationLogin={organization?.login || ""} spaceId={space.id} />
      <hr />
      <div className="w-full flex flex-1 min-h-screen bg-gray-50">
        <SpaceSidebar space={space} />
        <SidebarInset>
          <div className='container mx-auto py-6 pt-16'>
            <div className="space-4 p-6 relative">
              <Outlet />
            </div>
          </div>
        </SidebarInset>
      </div>
      <CreateIssueDialog
        isOpen={open}
        onOpenChange={setOpen}
        organizationLogin={organization?.login || ""}
      />
    </>
  )
}
