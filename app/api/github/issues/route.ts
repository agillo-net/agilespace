import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const organization = searchParams.get('org') || '';

    const accessToken = session.accessToken as string;
    
    // Build the GitHub search query
    let searchQuery = 'is:issue';
    if (query) {
      searchQuery += ` ${query}`;
    }
    if (organization) {
      searchQuery += ` org:${organization}`;
    }
    searchQuery += ' involves:@me'; // Only issues that involve the user
    
    // Fetch issues based on search query
    const response = await fetch(`https://api.github.com/search/issues?q=${encodeURIComponent(searchQuery)}&sort=updated&order=desc`, {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch GitHub issues" },
        { status: response.status }
      );
    }

    const searchResults = await response.json();
    return NextResponse.json(searchResults.items || []);
  } catch (error) {
    console.error("Error in GitHub issues API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
