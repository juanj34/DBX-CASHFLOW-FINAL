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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      developers: {
        Row: {
          created_at: string | null
          description: string | null
          founded_year: number | null
          headquarters: string | null
          id: string
          logo_url: string | null
          name: string
          occupancy_rate: number | null
          on_time_delivery_rate: number | null
          projects_launched: number | null
          units_sold: number | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          founded_year?: number | null
          headquarters?: string | null
          id?: string
          logo_url?: string | null
          name: string
          occupancy_rate?: number | null
          on_time_delivery_rate?: number | null
          projects_launched?: number | null
          units_sold?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          founded_year?: number | null
          headquarters?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          occupancy_rate?: number | null
          on_time_delivery_rate?: number | null
          projects_launched?: number | null
          units_sold?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          hotspot_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hotspot_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hotspot_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_hotspot_id_fkey"
            columns: ["hotspot_id"]
            isOneToOne: false
            referencedRelation: "hotspots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hotspots: {
        Row: {
          category: Database["public"]["Enums"]["hotspot_category"]
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          latitude: number
          longitude: number
          photos: string[] | null
          title: string
          updated_at: string
          visible: boolean
        }
        Insert: {
          category: Database["public"]["Enums"]["hotspot_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          latitude: number
          longitude: number
          photos?: string[] | null
          title: string
          updated_at?: string
          visible?: boolean
        }
        Update: {
          category?: Database["public"]["Enums"]["hotspot_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          latitude?: number
          longitude?: number
          photos?: string[] | null
          title?: string
          updated_at?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "hotspots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          areas_from: number | null
          construction_status:
            | Database["public"]["Enums"]["construction_status"]
            | null
          created_at: string
          delivery_date: string | null
          description: string | null
          developer: string | null
          developer_id: string | null
          hotspot_id: string | null
          id: string
          image_url: string | null
          latitude: number | null
          launch_date: string | null
          longitude: number | null
          name: string | null
          price_per_sqft: number | null
          starting_price: number | null
          unit_types: string[] | null
          updated_at: string
        }
        Insert: {
          areas_from?: number | null
          construction_status?:
            | Database["public"]["Enums"]["construction_status"]
            | null
          created_at?: string
          delivery_date?: string | null
          description?: string | null
          developer?: string | null
          developer_id?: string | null
          hotspot_id?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          launch_date?: string | null
          longitude?: number | null
          name?: string | null
          price_per_sqft?: number | null
          starting_price?: number | null
          unit_types?: string[] | null
          updated_at?: string
        }
        Update: {
          areas_from?: number | null
          construction_status?:
            | Database["public"]["Enums"]["construction_status"]
            | null
          created_at?: string
          delivery_date?: string | null
          description?: string | null
          developer?: string | null
          developer_id?: string | null
          hotspot_id?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          launch_date?: string | null
          longitude?: number | null
          name?: string | null
          price_per_sqft?: number | null
          starting_price?: number | null
          unit_types?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_hotspot_id_fkey"
            columns: ["hotspot_id"]
            isOneToOne: true
            referencedRelation: "hotspots"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          absorption_rate: number | null
          color: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          occupancy_rate: number | null
          polygon: Json
          population: number | null
          updated_at: string
          visible: boolean
        }
        Insert: {
          absorption_rate?: number | null
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          occupancy_rate?: number | null
          polygon: Json
          population?: number | null
          updated_at?: string
          visible?: boolean
        }
        Update: {
          absorption_rate?: number | null
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          occupancy_rate?: number | null
          polygon?: Json
          population?: number | null
          updated_at?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "zones_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "broker" | "viewer"
      construction_status: "off_plan" | "under_construction" | "ready"
      hotspot_category:
        | "landmark"
        | "transportation"
        | "attraction"
        | "project"
        | "other"
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
      app_role: ["admin", "broker", "viewer"],
      construction_status: ["off_plan", "under_construction", "ready"],
      hotspot_category: [
        "landmark",
        "transportation",
        "attraction",
        "project",
        "other",
      ],
    },
  },
} as const
