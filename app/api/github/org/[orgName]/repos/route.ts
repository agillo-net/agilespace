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
    
    // Get URL search params to support pagination
    const searchParams = request.nextUrl.searchParams;
    const per_page = searchParams.get('per_page') || '10';
    const page = searchParams.get('page') || '1';
    const sort = searchParams.get('sort') || 'updated';
    
    const response = await fetch(
      `https://api.github.com/orgs/${orgName}/repos?per_page=${per_page}&page=${page}&sort=${sort}`, 
      {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch repositories for organization: ${orgName}` },
        { status: response.status }
      );
    }

    const reposData = await response.json();
    return NextResponse.json(reposData);
  } catch (error) {
    console.error("Error in GitHub organization repos API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
