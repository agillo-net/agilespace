import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ButtonWithLoading } from "@/components/button-with-loading";
import type { SpaceWithMembership } from "@/types";
import type { UseMutationResult } from "@tanstack/react-query";
import type { Endpoints } from "@octokit/types";

type Org = Endpoints["GET /user/orgs"]["response"]["data"][number];

type CreateSpaceVariables = {
    name: string;
    slug: string;
    avatar_url: string;
    github_org_id: number;
};

type CreateSpaceMemberVariables = {
    space_id: string;
    role?: "admin" | "member" | "observer";
};

interface OrganizationCardProps {
    org: Org;
    space: SpaceWithMembership | undefined;
    navigateToSpace: (
        orgLogin: string,
        space: SpaceWithMembership | undefined
    ) => void;
    handleCreateSpace: (e: React.MouseEvent, org: Org) => void;
    handleJoinSpace: (e: React.MouseEvent, spaceId: string) => void;
    createSpaceMutation: UseMutationResult<
        unknown,
        Error,
        CreateSpaceVariables
    >;
    createSpaceMemberMutation: UseMutationResult<
        unknown,
        Error,
        CreateSpaceMemberVariables
    >;
}

export function OrganizationCard({
    org,
    space,
    navigateToSpace,
    handleCreateSpace,
    handleJoinSpace,
    createSpaceMutation,
    createSpaceMemberMutation,
}: OrganizationCardProps) {
    return (
        <Card
            key={org.login}
            className="cursor-pointer hover:shadow-md transition-shadow flex flex-col"
            onClick={() => navigateToSpace(org.login, space)}
        >
            <CardHeader>
                <div className="flex items-center gap-2">
                    {org.avatar_url && (
                        <img
                            src={org.avatar_url}
                            alt={org.login}
                            width={32}
                            height={32}
                            className="rounded-full"
                        />
                    )}
                    <CardTitle>{org.login}</CardTitle>
                </div>
                {org.description && (
                    <CardDescription className="mt-2">{org.description}</CardDescription>
                )}
                <a
                    href={`https://github.com/${org.login}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                >
                    View on GitHub
                </a>
            </CardHeader>
            <CardFooter className="flex flex-col items-stretch gap-2 mt-auto pt-4">
                <ButtonWithLoading
                    onClick={(e) => handleCreateSpace(e, org)}
                    loading={
                        createSpaceMutation.isPending &&
                        createSpaceMutation.variables?.github_org_id === org.id
                    }
                    disabled={
                        !!space ||
                        (createSpaceMutation.isPending &&
                            createSpaceMutation.variables?.github_org_id === org.id)
                    }
                >
                    {createSpaceMutation.isPending &&
                        createSpaceMutation.variables?.github_org_id === org.id
                        ? "Creating..."
                        : space
                            ? "Created"
                            : "Create Space"}
                </ButtonWithLoading>
                <ButtonWithLoading
                    onClick={(e) => handleJoinSpace(e, space?.id || "")}
                    loading={
                        createSpaceMemberMutation.isPending &&
                        createSpaceMemberMutation.variables?.space_id === space?.id
                    }
                    disabled={
                        space?.is_member ||
                        !space?.id ||
                        (createSpaceMemberMutation.isPending &&
                            createSpaceMemberMutation.variables?.space_id === space?.id)
                    }
                >
                    {createSpaceMemberMutation.isPending &&
                        createSpaceMemberMutation.variables?.space_id === space?.id
                        ? "Joining..."
                        : space?.is_member
                            ? `Joined (${space.member_role})`
                            : "Join Space"}
                </ButtonWithLoading>
                <ButtonWithLoading
                    onClick={(e) => {
                        e.stopPropagation();
                        navigateToSpace(org.login, space);
                    }}
                    disabled={!space?.is_member}
                >
                    View
                </ButtonWithLoading>
            </CardFooter>
        </Card>
    );
} 
