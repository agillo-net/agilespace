import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const accessToken = session.accessToken as string;
    
    // Fetch PRs where the user is requested as reviewer
    // Using the search API with the review-requested:<username> qualifier
    const username = session.user.login || session.user.name;
    const response = await fetch(
      `https://api.github.com/search/issues?q=is:pr+review-requested:${username}+state:open`, 
      {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch GitHub pull requests" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data.items || []);
  } catch (error) {
    console.error("Error in GitHub pull requests API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
