import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getSession();
    if (error || !data?.session) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Extract the GitHub access token from the user's session
    // This assumes your Supabase auth has linked GitHub provider
    const provider = data.session.user?.app_metadata?.provider;
    const providerToken = data.session.provider_token;

    if (!providerToken || provider !== 'github') {
      return NextResponse.json(
        { error: "No GitHub access token available" },
        { status: 401 }
      );
    }

    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${providerToken}`,
        Accept: "application/vnd.github.v3+json",
        "X-GitHub-Api-Version": "2022-11-28"
      },
    });

    if (!response.ok) {
      console.error("GitHub API response status:", response.status);
      return NextResponse.json(
        { error: "Failed to fetch GitHub user data" },
        { status: response.status }
      );
    }

    const userData = await response.json();

    return NextResponse.json(userData);
  } catch (error) {
    console.error("Error in GitHub user API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
