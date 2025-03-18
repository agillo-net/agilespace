import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgName: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const accessToken = session.accessToken as string;
    const { orgName } = await params;
    
    const response = await fetch(
      `https://api.github.com/orgs/${orgName}/teams`, 
      {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch teams for organization: ${orgName}` },
        { status: response.status }
      );
    }

    const teamsData = await response.json();
    return NextResponse.json(teamsData);
  } catch (error) {
    console.error("Error in GitHub organization teams API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
