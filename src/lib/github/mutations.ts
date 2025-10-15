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
    if (!octokit) throw new Error("Octokit client not initialized");
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

export async function createIssue({
    owner,
    repo,
    title,
    body,
}: {
    owner: string;
    repo: string;
    title: string;
    body?: string;
}) {
    const octokit = await getOctokitClient();
    if (!octokit) throw new Error("Octokit client not initialized");
    try {
        const response = await octokit.rest.issues.create({
            owner,
            repo,
            title,
            body,
        });
        return response.data;
    } catch (error) {
        console.error("Error creating issue:", error);
        throw error;
    }
}
