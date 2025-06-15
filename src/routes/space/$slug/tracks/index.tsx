import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createTrack } from '@/lib/supabase/mutations'
import { getSpaceAndTracks } from '@/lib/supabase/queries'
import { searchIssues } from '@/lib/github/queries'
import type { GitHubIssue, Track } from '@/types'
import { TracksListSkeleton } from '@/components/skeleton/tracks-list-skeleton'
import { useDebounce } from '@/hooks/use-debounce'
import { createSession } from '@/lib/supabase/mutations'
import { toast } from 'sonner'

export const Route = createFileRoute('/space/$slug/tracks/')({
    component: TracksPage,
    loader: async ({ params: { slug } }) => {
        return getSpaceAndTracks(slug)
    }
})

function TracksPage() {
    const { slug } = Route.useParams()
    const [searchQuery, setSearchQuery] = useState('')
    const debouncedSearchQuery = useDebounce(searchQuery, 1000)
    const queryClient = useQueryClient()

    // Load space and tracks data
    const { data: spaceData, isLoading } = useQuery({
        queryKey: ['space', slug],
        queryFn: () => getSpaceAndTracks(slug)
    })

    // Search issues
    const {
        data: searchResults,
        isLoading: isSearching,
        refetch: refetchSearch,
        error: searchError
    } = useQuery({
        queryKey: ['issues', slug, debouncedSearchQuery],
        queryFn: () => searchIssues(slug, debouncedSearchQuery),
        enabled: !!debouncedSearchQuery.trim(), // Only run when there's a non-empty search query
        retry: false
    })

    // Create track mutation
    const createTrackMutation = useMutation({
        mutationFn: async (issue: GitHubIssue) => {
            if (!spaceData?.space || !hasValidRepository(issue)) return
            const track = await createTrack({
                space_id: spaceData.space.id,
                repo_owner: issue.repository.owner || '',
                repo_name: issue.repository.name || '',
                issue_number: issue.number,
                title: issue.title,
            })
            // Start a session for the new track
            await createSession({
                track_id: track.id,
                space_member_id: spaceData.space_member.id,
            })
            return track
        },
        onSuccess: () => {
            // Invalidate and refetch space data
            queryClient.invalidateQueries({ queryKey: ['space', slug] })
            // Clear search
            setSearchQuery('')
            toast.success("Track created and session started")
        },
        onError: (error) => {
            toast.error(`Failed to create track: ${error.message}`)
        }
    })

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchQuery.trim()) return
        // Force immediate search when Enter is pressed
        refetchSearch()
    }

    const hasValidRepository = (issue: GitHubIssue): issue is GitHubIssue & { repository: NonNullable<GitHubIssue['repository']> } => {
        return !!issue.repository
    }

    const handleCreateTrack = async (issue: GitHubIssue) => {
        if (!spaceData?.space || !hasValidRepository(issue)) return
        createTrackMutation.mutate(issue)
    }

    const isTracked = (issue: GitHubIssue) => {
        if (!hasValidRepository(issue)) return false
        return spaceData?.tracks.some(
            track =>
                track.repo_owner === issue.repository.owner &&
                track.repo_name === issue.repository.name &&
                track.issue_number === issue.number
        )
    }

    const { tracks } = spaceData || { space: null, tracks: [] }

    if (isLoading) {
        return <TracksListSkeleton />
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Tracks</h1>

            {/* Search Form */}
            <div className="bg-white rounded-lg shadow p-6">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search issues..."
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        disabled={isSearching}
                        className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    >
                        {isSearching ? 'Searching...' : 'Search'}
                    </button>
                </form>
            </div>

            {/* Search Error */}
            {searchError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700">
                        {searchError instanceof Error
                            ? searchError.message
                            : 'Failed to search issues. Please try again.'}
                    </p>
                </div>
            )}

            {/* Search Results */}
            {searchResults && searchResults.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Search Results</h2>
                    <div className="space-y-4">
                        {searchResults
                            .map((issue) => (
                                <div
                                    key={issue.id}
                                    className="flex items-center justify-between p-4 border rounded-lg gap-4"
                                >
                                    <div>
                                        <h3 className="font-medium">{issue.title}</h3>
                                        <p className="text-sm text-gray-500">
                                            {issue.repository.name} #{issue.number}
                                        </p>
                                    </div>
                                    {isTracked(issue) ? (
                                        <span className="px-3 py-1 text-sm text-green-700 bg-green-100 rounded-full">
                                            Tracked
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => handleCreateTrack(issue)}
                                            disabled={createTrackMutation.isPending}
                                            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                                        >
                                            {createTrackMutation.isPending ? 'Creating...' : 'Track Issue'}
                                        </button>
                                    )}
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Existing Tracks */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Existing Tracks</h2>
                <div className="space-y-4">
                    {tracks.map((track: Track) => (
                        <div
                            key={track.id}
                            className="flex items-center justify-between p-4 border rounded-lg gap-4"
                        >
                            <div>
                                <h3 className="font-medium">{track.title}</h3>
                                <p className="text-sm text-gray-500">
                                    {track.repo_owner}/{track.repo_name} #{track.issue_number}
                                </p>
                            </div>
                            <span className="px-3 py-1 text-sm text-green-700 bg-green-100 rounded-full">
                                Tracked
                            </span>
                        </div>
                    ))}
                    {tracks.length === 0 && (
                        <p className="text-gray-500 text-center py-4">
                            No tracks created yet. Use the search above to find and track issues.
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
} 
