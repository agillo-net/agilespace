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
    
    // GraphQL query to fetch ProjectsV2 for the organization
    const graphqlQuery = {
      query: `
        query($orgName: String!) {
          organization(login: $orgName) {
            projectsV2(first: 100) {
              nodes {
                id
                title
                number
                closed
                shortDescription
                url
                createdAt
                updatedAt
              }
            }
          }
        }
      `,
      variables: {
        orgName: orgName
      }
    };

    // Use GraphQL endpoint with POST method
    const response = await fetch(
      'https://api.github.com/graphql',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(graphqlQuery)
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch projects for organization: ${orgName}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Check for GraphQL errors in the response
    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
      return NextResponse.json(
        { error: data.errors[0].message || "Error fetching projects" },
        { status: 500 }
      );
    }

    // Extract projects from the GraphQL response
    const projectsData = data.data.organization?.projectsV2?.nodes || [];
    return NextResponse.json(projectsData);
  } catch (error) {
    console.error("Error in GitHub organization projects API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
