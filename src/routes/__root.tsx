import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { Toaster } from '@/components/ui/sonner'

export const Route = createRootRouteWithContext()({
  component: RootComponent,
  errorComponent: ErrorBoundary,
})

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toaster />
    </>
  )
}

function ErrorBoundary({ error }: { error: Error }) {
  console.error('Root Error Boundary caught:', error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Oops! Something went wrong</h1>
        <p className="text-gray-600 mb-4">
          We encountered an error while loading this page. Please try refreshing or contact support if the problem persists.
        </p>
        <details className="mb-4">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
            Technical Details
          </summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
            {error.message}
          </pre>
        </details>
        <div className="flex gap-2">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Refresh Page
          </button>
          <button
            onClick={() => window.location.href = '/login'}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  )
}
