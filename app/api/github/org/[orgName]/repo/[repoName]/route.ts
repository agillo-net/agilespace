import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth"
import { auth } from "@/auth"

export async function GET(
  request: Request,
  { params }: { params: { orgName: string; repoName: string } }
) {
  try {
    const session = await auth()
    if (!session?.accessToken) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' }
      })
    }

    const { orgName, repoName } = params
    
    // Fetch repository data from GitHub API
    const response = await fetch(
      `https://api.github.com/repos/${orgName}/${repoName}`,
      {
        headers: {
          Authorization: `token ${session.accessToken}`,
          Accept: 'application/vnd.github.v3+json'
        }
      }
    )

    if (!response.ok) {
      return new NextResponse(JSON.stringify({ error: 'Failed to fetch repository data' }), {
        status: response.status,
        headers: { 'content-type': 'application/json' }
      })
    }

    const repoData = await response.json()
    
    return new NextResponse(JSON.stringify(repoData), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    })
  } catch (error) {
    console.error('Error fetching repository data:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    })
  }
}
