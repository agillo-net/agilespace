import { getOctokitClient } from "./client";

export async function createIssueComment({
    owner,
    repo,
    issue_number,
    body,
}: {
    owner: string;
    repo: string;
    issue_number: number;
    body: string;
}) {
    const octokit = await getOctokitClient();
    try {
        const response = await octokit.rest.issues.createComment({
            owner,
            repo,
            issue_number,
            body,
        });
        return response.data;
    } catch (error) {
        console.error("Error creating issue comment:", error);
        throw error;
    }
}
