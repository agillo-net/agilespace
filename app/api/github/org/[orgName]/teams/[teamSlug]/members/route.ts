import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { orgName: string, teamSlug: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const accessToken = session.accessToken as string;
    const { orgName, teamSlug } = params;
    
    const response = await fetch(
      `https://api.github.com/orgs/${orgName}/teams/${teamSlug}/members`, 
      {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch members for team: ${teamSlug}` },
        { status: response.status }
      );
    }

    const membersData = await response.json();
    
    // Process the members data to match our TeamMember interface
    const formattedMembers = membersData.map((member: any) => ({
      login: member.login,
      avatar_url: member.avatar_url,
      html_url: member.html_url,
      role: member.role || "member", // Default role if not provided
    }));
    
    return NextResponse.json(formattedMembers);
  } catch (error) {
    console.error("Error in GitHub team members API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
