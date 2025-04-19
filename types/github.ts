export interface Issue {
    id: number;
    number: number;
    title: string;
    html_url: string;
    state: string;
    updated_at: string;
    repository_url: string;
    user: {
        login: string;
        avatar_url?: string;
    };
    assignees?: {
        login: string;
        avatar_url?: string;
    }[];
} 