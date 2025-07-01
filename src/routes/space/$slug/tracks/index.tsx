import { createFileRoute } from '@tanstack/react-router'
import { getSpaceAndTracks } from '@/lib/supabase/queries'
import type { GitHubIssue, Track } from '@/types'
import { TracksListSkeleton } from '@/components/skeleton/tracks-list-skeleton'
import { SearchForm } from '@/components/search-form'
import { useTracks } from '@/hooks/api/use-tracks'

export const Route = createFileRoute('/space/$slug/tracks/')({
    component: TracksPage,
    loader: async ({ params: { slug } }) => {
        return getSpaceAndTracks(slug)
    }
})

function TracksPage() {
    const { slug } = Route.useParams()
    const {
        searchQuery,
        setSearchQuery,
        isLoading,
        searchResults,
        isSearching,
        searchError,
        tracks,
        createTrackMutation,
        handleSearch,
        isTracked,
    } = useTracks(slug)

    if (isLoading) {
        return <TracksListSkeleton />
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Tracks</h1>

            {/* Search Form */}
            <SearchForm
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                onSubmit={handleSearch}
                isSearching={isSearching}
                isDisabled={createTrackMutation.isPending}
                error={searchError}
            />

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
                                            {issue.repository?.name} #{issue.number}
                                        </p>
                                    </div>
                                    {isTracked(issue) ? (
                                        <span className="px-3 py-1 text-sm text-green-700 bg-green-100 rounded-full">
                                            Tracked
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => createTrackMutation.mutate(issue)}
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
