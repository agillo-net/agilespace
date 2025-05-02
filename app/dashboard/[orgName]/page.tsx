"use client";

import { redirect, useParams } from "next/navigation";

export default function OrgPage() {
  const { orgName }: { orgName: string } = useParams();

  redirect(`/dashboard/${orgName}/overview`);
}
