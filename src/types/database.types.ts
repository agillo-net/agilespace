export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      spaces: {
        Row: {
          id: string
          name: string
          slug: string
          avatar_url: string | null
          github_org_id: number | null
          github_org_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          github_org_id?: number | null
          github_org_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          github_org_id?: number | null
          github_org_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      space_members: {
        Row: {
          id: string
          space_id: string
          user_id: string
          role: string
          nickname: string | null
          status: string | null
          location: string | null
          joined_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          space_id: string
          user_id: string
          role?: string
          nickname?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          space_id?: string
          user_id?: string
          role?: string
          nickname?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          github_username: string | null
          github_id: number | null
          avatar_url: string | null
          full_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          github_username?: string | null
          github_id?: number | null
          avatar_url?: string | null
          full_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          github_username?: string | null
          github_id?: number | null
          avatar_url?: string | null
          full_name?: string | null
          created_at?: string
        }
      }
      tracks: {
        Row: {
          id: string
          space_id: string
          repo_owner: string
          repo_name: string
          issue_number: number
          title: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          space_id: string
          repo_owner: string
          repo_name: string
          issue_number: number
          title?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          space_id?: string
          repo_owner?: string
          repo_name?: string
          issue_number?: number
          title?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          space_member_id: string
          track_id: string
          started_at: string
          ended_at: string | null
          summary: string | null
          comment_url: string | null
          skipped_summary: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          space_member_id: string
          track_id: string
          started_at?: string
          ended_at?: string | null
          summary?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          space_member_id?: string
          track_id?: string
          started_at?: string
          ended_at?: string | null
          summary?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          space_id: string
          name: string
          color: string | null
          created_at: string
        }
        Insert: {
          id?: string
          space_id: string
          name: string
          color?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          space_id?: string
          name?: string
          color?: string | null
          created_at?: string
        }
      }
      github_repo_permissions: {
        Row: {
          id: string
          user_id: string
          space_id: string
          repo_owner: string
          repo_name: string
          permission_level: string
          last_synced_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          space_id: string
          repo_owner: string
          repo_name: string
          permission_level: string
          last_synced_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          space_id?: string
          repo_owner?: string
          repo_name?: string
          permission_level?: string
          last_synced_at?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
