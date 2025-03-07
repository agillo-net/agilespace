import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Octokit } from '@octokit/rest';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { owner, repo, issueNumber, comment } = await req.json();

    if (!owner || !repo || !issueNumber || !comment) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const octokit = new Octokit({
      auth: session.accessToken,
    });

    // Post a comment to the GitHub issue
    const response = await octokit.issues.createComment({
      owner,
      repo,
      issue_number: parseInt(issueNumber),
      body: comment,
    });

    return NextResponse.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Error posting GitHub comment:', error);
    
    return NextResponse.json(
      { error: 'Failed to post comment to GitHub' },
      { status: 500 }
    );
  }
}
