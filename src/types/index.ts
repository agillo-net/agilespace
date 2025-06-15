import type { Database } from "@/types/database.types";
import type { components } from "@octokit/openapi-types";

export type Space = Database['public']['Tables']['spaces']['Row'];

export type SpaceMember = Database['public']['Tables']['space_members']['Row'];

export type Profile = Database['public']['Tables']['profiles']['Row'];

export type Track = Database['public']['Tables']['tracks']['Row'];

export type Session = Database['public']['Tables']['sessions']['Row'];

export type Tag = Database['public']['Tables']['tags']['Row'];

// This interface extends the Space interface to include membership information
export interface SpaceWithMembership extends Space {
    is_member: boolean;
    member_role: string | null;
}

type SearchResultItem = components["schemas"]["issue-search-result-item"];
export type GitHubIssue = Omit<SearchResultItem, 'repository'> & {
    repository: {
        owner: string | undefined;
        name: string | undefined;
    };
};
