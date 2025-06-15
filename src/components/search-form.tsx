interface SearchFormProps {
    searchQuery: string
    onSearchQueryChange: (query: string) => void
    onSubmit: (e: React.FormEvent) => void
    isSearching: boolean
    isDisabled: boolean
}

export function SearchForm({
    searchQuery,
    onSearchQueryChange,
    onSubmit,
    isSearching,
    isDisabled
}: SearchFormProps) {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={onSubmit} className="flex gap-4">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchQueryChange(e.target.value)}
                    placeholder="Search issues to start a new session..."
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isDisabled}
                />
                <button
                    type="submit"
                    disabled={isSearching || isDisabled}
                    className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                    {isSearching ? 'Searching...' : 'Search'}
                </button>
            </form>
            {isDisabled && (
                <p className="mt-2 text-sm text-gray-500">
                    Please end your current session before starting a new one.
                </p>
            )}
        </div>
    )
} 
