// Add type definitions at the top of the file

export interface Space {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
    [key: string]: any; // for other potential space fields
}

// This interface represents a space member, which includes the space and the role of the member
export interface SpaceMember {
    space: Space;
    role: string;
}

// This interface extends the Space interface to include membership information
export interface SpaceWithMembership extends Space {
    is_member: boolean;
    member_role: string | null;
}
