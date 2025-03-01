import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { orgName: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const accessToken = session.accessToken as string;
    const { orgName } = params;
    
    const response = await fetch(
      `https://api.github.com/orgs/${orgName}/projects`, 
      {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
          // Projects API requires specific preview header
          "Accept-Encoding": "application/vnd.github.inertia-preview+json"
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch projects for organization: ${orgName}` },
        { status: response.status }
      );
    }

    const projectsData = await response.json();
    return NextResponse.json(projectsData);
  } catch (error) {
    console.error("Error in GitHub organization projects API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
