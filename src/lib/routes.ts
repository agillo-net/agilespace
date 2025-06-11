// Define route paths first
export const ROUTES = {
    ROOT: '/',
    LOGIN: '/login',
    SPACES: '/spaces',
    SPACE: '/space',
    SPACE_SLUG: (slug: string) => `/space/${slug}`,
} as const

/**
 * Helper functions to generate route paths with parameters.
 * Use these functions when you need to create dynamic routes with parameters.
 * @example
 * ```ts
 * // Generate a path for a specific space
 * const spacePath = generatePath.space('my-org')
 * // Result: '/space/my-org'
 * ```
 */
export const generatePath = {
    space: (slug: string) => ROUTES.SPACE_SLUG(slug),
} as const

/**
 * TypeScript type for route paths.
 * This type represents all possible route paths in the application,
 * including both static routes and dynamic routes with parameters.
 * @example
 * ```ts
 * const path: RoutePath = ROUTES.SPACES
 * const dynamicPath: RoutePath = generatePath.space('my-org')
 * ```
 */
export type RoutePath = typeof ROUTES[keyof typeof ROUTES] | ReturnType<typeof ROUTES.SPACE_SLUG> 
