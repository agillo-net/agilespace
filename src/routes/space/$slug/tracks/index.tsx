import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { getSpaceAndTracks } from '@/lib/supabase/queries'
import type { TrackWithSessionData } from '@/types'
import { TracksListSkeleton } from '@/components/skeleton/tracks-list-skeleton'
import { SearchForm } from '@/components/search-form'
import { useTracks } from '@/hooks/api/use-tracks'
import { useSessions } from '@/hooks/api/use-sessions'
import { useSpaceMembers } from '@/hooks/api/use-space-members'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatTime } from '@/lib/utils'

export const Route = createFileRoute('/space/$slug/tracks/')({
    component: TracksPage,
    loader: async ({ params: { slug } }) => {
        return getSpaceAndTracks(slug)
    }
})

function TracksPage() {
    const { slug } = Route.useParams()
    const navigate = useNavigate()
    const [selectedMember, setSelectedMember] = useState<string>('all')
    const {
        searchQuery,
        setSearchQuery,
        isLoading,
        searchResults,
        isSearching,
        searchError,
        tracksWithSessionData,
        handleSearch,
        isTracked,
    } = useTracks(slug)
    
    const { createTrackAndStartSessionMutation } = useSessions(slug)
    const { members } = useSpaceMembers(slug)

    // Filter tracks based on selected member
    const filteredTracks = selectedMember === 'all' 
        ? tracksWithSessionData 
        : tracksWithSessionData.filter(track => 
            track.participants.some((participant: { id: string; name: string; avatar_url: string }) => participant.id === selectedMember)
          )

    // Handle track click navigation
    const handleTrackClick = (trackId: string) => {
        navigate({
            to: '/space/$slug/sessions',
            params: { slug },
            search: { track: trackId }
        })
    }

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
                isDisabled={createTrackAndStartSessionMutation.isPending}
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
                                            onClick={() => createTrackAndStartSessionMutation.mutate(issue)}
                                            disabled={createTrackAndStartSessionMutation.isPending}
                                            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                                        >
                                            {createTrackAndStartSessionMutation.isPending ? 'Creating...' : 'Track Issue'}
                                        </button>
                                    )}
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Existing Tracks */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Existing Tracks</h2>
                    {/* Team Member Filter */}
                    <Select value={selectedMember} onValueChange={setSelectedMember}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Filter by team member" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Members</SelectItem>
                            {members?.map(({ member, profile }) => (
                                <SelectItem key={member.user_id} value={member.user_id || ''}>
                                    {profile?.full_name || 'Unknown'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-4">
                    {filteredTracks.map((track: TrackWithSessionData) => (
                        <button
                            key={track.id}
                            onClick={() => handleTrackClick(track.id)}
                            className="w-full flex items-center justify-between p-4 border rounded-lg gap-4 hover:bg-gray-50 hover:border-gray-300 transition-colors text-left"
                        >
                            <div className="flex-1">
                                <h3 className="font-medium">{track.title}</h3>
                                <p className="text-sm text-gray-500">
                                    {track.repo_owner}/{track.repo_name} #{track.issue_number}
                                </p>
                                {/* Total Time */}
                                <p className="text-sm text-blue-600 font-medium mt-1">
                                    Total time: {track.totalTime > 0 ? formatTime(track.totalTime) : '0h 0m'}
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                {/* Overlapping Avatars */}
                                {track.participants.length > 0 && (
                                    <div className="flex -space-x-2">
                                        {track.participants.slice(0, 3).map((participant: { id: string; avatar_url: string | null; name: string }) => (
                                            <Avatar key={participant.id} className="h-8 w-8 border-2 border-white">
                                                <AvatarImage src={participant.avatar_url || undefined} alt={participant.name} />
                                                <AvatarFallback className="text-xs">
                                                    {participant.name.slice(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        ))}
                                        {track.participants.length > 3 && (
                                            <div className="h-8 w-8 bg-gray-100 border-2 border-white rounded-full flex items-center justify-center">
                                                <span className="text-xs text-gray-500">
                                                    +{track.participants.length - 3}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                <span className="px-3 py-1 text-sm text-green-700 bg-green-100 rounded-full">
                                    Tracked
                                </span>
                            </div>
                        </button>
                    ))}
                    {filteredTracks.length === 0 && tracksWithSessionData.length === 0 && (
                        <p className="text-gray-500 text-center py-4">
                            No tracks created yet. Use the search above to find and track issues.
                        </p>
                    )}
                    {filteredTracks.length === 0 && tracksWithSessionData.length > 0 && (
                        <p className="text-gray-500 text-center py-4">
                            No tracks found for the selected team member.
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
