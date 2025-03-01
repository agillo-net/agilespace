import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const accessToken = session.accessToken as string;
    
    // Fetch issues assigned to the authenticated user
    const response = await fetch("https://api.github.com/issues?filter=assigned", {
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

    const issuesData = await response.json();
    return NextResponse.json(issuesData);
  } catch (error) {
    console.error("Error in GitHub issues API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
