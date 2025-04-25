import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Octokit } from 'octokit';

/**
 * POST handler for GitHub API requests
 * Handles GraphQL queries and mutations by passing them to GitHub's API
 * Authentication is handled via the user's Supabase session
 */
export async function POST(req: NextRequest) {
  try {
    // Parse the JSON request body
    const body = await req.json();
    const { query, variables } = body;

    if (!query) {
      return NextResponse.json(
        { error: "Missing required 'query' parameter" },
        { status: 400 }
      );
    }

    // Get the authorization header from the request
    // This assumes the client is sending the session token in the Authorization header
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in with GitHub.' },
        { status: 401 }
      );
    }
    
    // Extract the token
    const token = authHeader.substring(7);
    
    // Create an Octokit instance with the GitHub token
    const octokit = new Octokit({
      auth: token
    });

    // Execute the GraphQL query using the Octokit instance
    const response = await octokit.graphql(query, variables || {});

    // Return the successful response
    return NextResponse.json({ data: response });
    
  } catch (error: any) {
    console.error('GitHub API route error:', error);
    
    // Handle GitHub specific error responses
    if (error.response) {
      const status = error.response.status || 500;
      const message = error.response.data?.message || error.message;
      
      return NextResponse.json(
        { 
          error: message,
          errors: error.response.data?.errors 
        },
        { status }
      );
    }
    
    // Handle general errors
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}