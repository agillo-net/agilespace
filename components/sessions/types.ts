export interface Session {
  id: string;
  github_issue_link: string;
  notes: string | null;
  start_time: string;
  end_time: string | null;
  status: "active" | "paused" | "completed";
  total_duration: string;
  last_paused_at: string | null;
  created_at: string;
  updated_at: string;
  organization_id: string;
  user_id: string;
  participant_name: string;
  organization_name: string;
  labels: string[] | null;
  hours: number;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  description?: string;
}