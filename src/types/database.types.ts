export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      github_repo_permissions: {
        Row: {
          created_at: string | null
          id: string
          last_synced_at: string | null
          permission_level: string
          repo_name: string
          repo_owner: string
          space_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_synced_at?: string | null
          permission_level?: string
          repo_name: string
          repo_owner: string
          space_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_synced_at?: string | null
          permission_level?: string
          repo_name?: string
          repo_owner?: string
          space_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "github_repo_permissions_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          email_digest_frequency: string | null
          email_enabled: boolean | null
          enabled_types:
            | Database["public"]["Enums"]["notification_type"][]
            | null
          id: string
          space_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_digest_frequency?: string | null
          email_enabled?: boolean | null
          enabled_types?:
            | Database["public"]["Enums"]["notification_type"][]
            | null
          id?: string
          space_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_digest_frequency?: string | null
          email_enabled?: boolean | null
          enabled_types?:
            | Database["public"]["Enums"]["notification_type"][]
            | null
          id?: string
          space_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          actor_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          message: string
          metadata: Json | null
          priority: Database["public"]["Enums"]["notification_priority"]
          read: boolean | null
          read_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          space_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          action_url?: string | null
          actor_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["notification_priority"]
          read?: boolean | null
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          space_id?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          action_url?: string | null
          actor_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["notification_priority"]
          read?: boolean | null
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          space_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          github_id: number | null
          github_username: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          github_id?: number | null
          github_username?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          github_id?: number | null
          github_username?: string | null
          id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_id: string | null
          role: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_id?: string | null
          role: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_id?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_duration_change_requests: {
        Row: {
          created_at: string | null
          id: string
          original_ended_at: string | null
          original_started_at: string
          reason: string | null
          requested_by: string | null
          requested_ended_at: string | null
          requested_started_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          session_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          original_ended_at?: string | null
          original_started_at: string
          reason?: string | null
          requested_by?: string | null
          requested_ended_at?: string | null
          requested_started_at: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          session_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          original_ended_at?: string | null
          original_started_at?: string
          reason?: string | null
          requested_by?: string | null
          requested_ended_at?: string | null
          requested_started_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          session_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_duration_change_requests_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_tags: {
        Row: {
          session_id: string
          tag_id: string
        }
        Insert: {
          session_id: string
          tag_id: string
        }
        Update: {
          session_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_tags_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          comment_url: string | null
          ended_at: string | null
          id: string
          skipped_summary: boolean | null
          space_member_id: string | null
          started_at: string
          track_id: string | null
        }
        Insert: {
          comment_url?: string | null
          ended_at?: string | null
          id?: string
          skipped_summary?: boolean | null
          space_member_id?: string | null
          started_at: string
          track_id?: string | null
        }
        Update: {
          comment_url?: string | null
          ended_at?: string | null
          id?: string
          skipped_summary?: boolean | null
          space_member_id?: string | null
          started_at?: string
          track_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_space_member_id_fkey"
            columns: ["space_member_id"]
            isOneToOne: false
            referencedRelation: "space_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      space_member_permissions: {
        Row: {
          granted: boolean
          granted_at: string | null
          granted_by: string | null
          id: string
          permission_id: string
          space_member_id: string
        }
        Insert: {
          granted?: boolean
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission_id: string
          space_member_id: string
        }
        Update: {
          granted?: boolean
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission_id?: string
          space_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_member_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_member_permissions_space_member_id_fkey"
            columns: ["space_member_id"]
            isOneToOne: false
            referencedRelation: "space_members"
            referencedColumns: ["id"]
          },
        ]
      }
      space_members: {
        Row: {
          id: string
          joined_at: string | null
          last_active_at: string | null
          last_status_update_at: string | null
          location: string | null
          nickname: string | null
          role: string
          space_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          joined_at?: string | null
          last_active_at?: string | null
          last_status_update_at?: string | null
          location?: string | null
          nickname?: string | null
          role: string
          space_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          joined_at?: string | null
          last_active_at?: string | null
          last_status_update_at?: string | null
          location?: string | null
          nickname?: string | null
          role?: string
          space_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "space_members_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          github_org_id: number | null
          id: string
          name: string
          plan: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          github_org_id?: number | null
          id?: string
          name: string
          plan?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          github_org_id?: number | null
          id?: string
          name?: string
          plan?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          space_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          space_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          space_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tags_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      time_off_requests: {
        Row: {
          created_at: string | null
          end_date: string
          half_day_period: string | null
          id: string
          is_half_day: boolean | null
          notes: string | null
          reason: string | null
          requested_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          space_id: string
          space_member_id: string
          start_date: string
          status: Database["public"]["Enums"]["time_off_status"]
          total_days: number
          type: Database["public"]["Enums"]["time_off_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          half_day_period?: string | null
          id?: string
          is_half_day?: boolean | null
          notes?: string | null
          reason?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          space_id: string
          space_member_id: string
          start_date: string
          status?: Database["public"]["Enums"]["time_off_status"]
          total_days: number
          type?: Database["public"]["Enums"]["time_off_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          half_day_period?: string | null
          id?: string
          is_half_day?: boolean | null
          notes?: string | null
          reason?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          space_id?: string
          space_member_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["time_off_status"]
          total_days?: number
          type?: Database["public"]["Enums"]["time_off_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_off_requests_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_off_requests_space_member_id_fkey"
            columns: ["space_member_id"]
            isOneToOne: false
            referencedRelation: "space_members"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          issue_number: number
          repo_name: string
          repo_owner: string
          space_id: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          issue_number: number
          repo_name: string
          repo_owner: string
          space_id?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          issue_number?: number
          repo_name?: string
          repo_owner?: string
          space_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracks_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_time_off_days: {
        Args: {
          p_end_date: string
          p_is_half_day?: boolean
          p_start_date: string
        }
        Returns: number
      }
      check_time_off_conflicts: {
        Args: {
          p_end_date: string
          p_exclude_request_id?: string
          p_space_member_id: string
          p_start_date: string
        }
        Returns: {
          end_date: string
          request_id: string
          start_date: string
          status: Database["public"]["Enums"]["time_off_status"]
        }[]
      }
      create_notification: {
        Args: {
          p_action_url?: string
          p_actor_id?: string
          p_message: string
          p_metadata?: Json
          p_priority?: Database["public"]["Enums"]["notification_priority"]
          p_related_entity_id?: string
          p_related_entity_type?: string
          p_space_id?: string
          p_title: string
          p_type: Database["public"]["Enums"]["notification_type"]
          p_user_id: string
        }
        Returns: string
      }
      create_space_with_admin: {
        Args: {
          p_avatar_url?: string
          p_github_org_id?: number
          p_name: string
          p_slug: string
        }
        Returns: string
      }
      delete_old_notifications: {
        Args: { p_days_old?: number }
        Returns: number
      }
      get_team_time_off: {
        Args: {
          p_end_date: string
          p_space_id: string
          p_start_date: string
          p_status_filter?: Database["public"]["Enums"]["time_off_status"][]
        }
        Returns: {
          avatar_url: string
          end_date: string
          id: string
          is_half_day: boolean
          member_name: string
          space_member_id: string
          start_date: string
          status: Database["public"]["Enums"]["time_off_status"]
          total_days: number
          type: Database["public"]["Enums"]["time_off_type"]
        }[]
      }
      get_unread_notification_count: {
        Args: { p_space_id?: string; p_user_id: string }
        Returns: number
      }
      get_user_accessible_repos: {
        Args: {
          p_min_permission?: string
          p_space_id: string
          p_user_id: string
        }
        Returns: {
          permission_level: string
          repo_name: string
          repo_owner: string
        }[]
      }
      get_user_permissions: {
        Args: { p_space_id: string; p_user_id: string }
        Returns: {
          granted: boolean
          permission_name: string
        }[]
      }
      mark_all_notifications_read: {
        Args: { p_space_id?: string; p_user_id: string }
        Returns: number
      }
      notify_space_admins: {
        Args: {
          p_action_url?: string
          p_actor_id?: string
          p_message: string
          p_metadata?: Json
          p_related_entity_id?: string
          p_related_entity_type?: string
          p_space_id: string
          p_title: string
          p_type: Database["public"]["Enums"]["notification_type"]
        }
        Returns: number
      }
      user_has_permission: {
        Args: {
          p_permission_name: string
          p_space_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      user_has_repo_access: {
        Args: {
          p_min_permission?: string
          p_repo_name: string
          p_repo_owner: string
          p_space_id: string
          p_user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      notification_priority: "low" | "medium" | "high" | "urgent"
      notification_type:
        | "time_off_requested"
        | "time_off_approved"
        | "time_off_rejected"
        | "time_off_cancelled"
        | "member_joined"
        | "member_left"
        | "issue_assigned"
        | "issue_mentioned"
        | "change_request_review"
        | "change_request_approved"
        | "change_request_rejected"
        | "system_announcement"
        | "other"
      time_off_status: "pending" | "approved" | "rejected" | "cancelled"
      time_off_type: "vacation" | "sick_leave" | "personal" | "unpaid" | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      notification_priority: ["low", "medium", "high", "urgent"],
      notification_type: [
        "time_off_requested",
        "time_off_approved",
        "time_off_rejected",
        "time_off_cancelled",
        "member_joined",
        "member_left",
        "issue_assigned",
        "issue_mentioned",
        "change_request_review",
        "change_request_approved",
        "change_request_rejected",
        "system_announcement",
        "other",
      ],
      time_off_status: ["pending", "approved", "rejected", "cancelled"],
      time_off_type: ["vacation", "sick_leave", "personal", "unpaid", "other"],
    },
  },
} as const
