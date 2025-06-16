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
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchQueryChange(e.target.value)}
                        placeholder="Search issues to start a new session..."
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isDisabled}
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => onSearchQueryChange('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            disabled={isDisabled}
                        >
                            ×
                        </button>
                    )}
                </div>
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
