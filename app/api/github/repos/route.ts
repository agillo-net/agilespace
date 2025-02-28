import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const accessToken = session.accessToken as string;
    
    const response = await fetch(
      "https://api.github.com/user/repos?sort=updated&per_page=10",
      {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch GitHub repositories" },
        { status: response.status }
      );
    }

    const reposData = await response.json();
    return NextResponse.json(reposData);
  } catch (error) {
    console.error("Error in GitHub repos API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
