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
      acquired_properties: {
        Row: {
          acquisition_fees: number | null
          broker_id: string
          client_id: string | null
          created_at: string | null
          current_value: number | null
          developer: string | null
          has_mortgage: boolean | null
          id: string
          is_rented: boolean | null
          last_valuation_date: string | null
          monthly_mortgage_payment: number | null
          monthly_rent: number | null
          mortgage_amount: number | null
          mortgage_balance: number | null
          mortgage_interest_rate: number | null
          mortgage_term_years: number | null
          notes: string | null
          project_name: string
          purchase_date: string
          purchase_price: number
          rental_start_date: string | null
          source_quote_id: string | null
          unit: string | null
          unit_size_sqf: number | null
          unit_type: string | null
          updated_at: string | null
        }
        Insert: {
          acquisition_fees?: number | null
          broker_id: string
          client_id?: string | null
          created_at?: string | null
          current_value?: number | null
          developer?: string | null
          has_mortgage?: boolean | null
          id?: string
          is_rented?: boolean | null
          last_valuation_date?: string | null
          monthly_mortgage_payment?: number | null
          monthly_rent?: number | null
          mortgage_amount?: number | null
          mortgage_balance?: number | null
          mortgage_interest_rate?: number | null
          mortgage_term_years?: number | null
          notes?: string | null
          project_name: string
          purchase_date: string
          purchase_price: number
          rental_start_date?: string | null
          source_quote_id?: string | null
          unit?: string | null
          unit_size_sqf?: number | null
          unit_type?: string | null
          updated_at?: string | null
        }
        Update: {
          acquisition_fees?: number | null
          broker_id?: string
          client_id?: string | null
          created_at?: string | null
          current_value?: number | null
          developer?: string | null
          has_mortgage?: boolean | null
          id?: string
          is_rented?: boolean | null
          last_valuation_date?: string | null
          monthly_mortgage_payment?: number | null
          monthly_rent?: number | null
          mortgage_amount?: number | null
          mortgage_balance?: number | null
          mortgage_interest_rate?: number | null
          mortgage_term_years?: number | null
          notes?: string | null
          project_name?: string
          purchase_date?: string
          purchase_price?: number
          rental_start_date?: string | null
          source_quote_id?: string | null
          unit?: string | null
          unit_size_sqf?: number | null
          unit_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acquired_properties_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acquired_properties_source_quote_id_fkey"
            columns: ["source_quote_id"]
            isOneToOne: false
            referencedRelation: "cashflow_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acquired_properties_source_quote_id_fkey"
            columns: ["source_quote_id"]
            isOneToOne: false
            referencedRelation: "cashflow_quotes_public"
            referencedColumns: ["id"]
          },
        ]
      }
      appreciation_presets: {
        Row: {
          builtin_key: string | null
          construction_appreciation: number
          created_at: string | null
          growth_appreciation: number
          growth_period_years: number
          id: string
          is_builtin_override: boolean | null
          mature_appreciation: number
          name: string
          rent_growth_rate: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          builtin_key?: string | null
          construction_appreciation?: number
          created_at?: string | null
          growth_appreciation?: number
          growth_period_years?: number
          id?: string
          is_builtin_override?: boolean | null
          mature_appreciation?: number
          name: string
          rent_growth_rate?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          builtin_key?: string | null
          construction_appreciation?: number
          created_at?: string | null
          growth_appreciation?: number
          growth_period_years?: number
          id?: string
          is_builtin_override?: boolean | null
          mature_appreciation?: number
          name?: string
          rent_growth_rate?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cashflow_images: {
        Row: {
          created_at: string | null
          id: string
          image_type: string
          image_url: string
          quote_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_type: string
          image_url: string
          quote_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_type?: string
          image_url?: string
          quote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_images_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "cashflow_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_images_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "cashflow_quotes_public"
            referencedColumns: ["id"]
          },
        ]
      }
      cashflow_quotes: {
        Row: {
          archived_at: string | null
          broker_id: string
          client_country: string | null
          client_email: string | null
          client_id: string | null
          client_name: string | null
          created_at: string | null
          developer: string | null
          first_viewed_at: string | null
          id: string
          inputs: Json
          is_archived: boolean | null
          last_viewed_at: string | null
          negotiation_started_at: string | null
          presented_at: string | null
          project_name: string | null
          share_token: string | null
          sold_at: string | null
          status: string | null
          status_changed_at: string | null
          title: string | null
          unit: string | null
          unit_size_m2: number | null
          unit_size_sqf: number | null
          unit_type: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          archived_at?: string | null
          broker_id: string
          client_country?: string | null
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string | null
          developer?: string | null
          first_viewed_at?: string | null
          id?: string
          inputs?: Json
          is_archived?: boolean | null
          last_viewed_at?: string | null
          negotiation_started_at?: string | null
          presented_at?: string | null
          project_name?: string | null
          share_token?: string | null
          sold_at?: string | null
          status?: string | null
          status_changed_at?: string | null
          title?: string | null
          unit?: string | null
          unit_size_m2?: number | null
          unit_size_sqf?: number | null
          unit_type?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          archived_at?: string | null
          broker_id?: string
          client_country?: string | null
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string | null
          developer?: string | null
          first_viewed_at?: string | null
          id?: string
          inputs?: Json
          is_archived?: boolean | null
          last_viewed_at?: string | null
          negotiation_started_at?: string | null
          presented_at?: string | null
          project_name?: string | null
          share_token?: string | null
          sold_at?: string | null
          status?: string | null
          status_changed_at?: string | null
          title?: string | null
          unit?: string | null
          unit_size_m2?: number | null
          unit_size_sqf?: number | null
          unit_type?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_quotes_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          broker_id: string
          country: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          portal_enabled: boolean | null
          portal_token: string | null
          updated_at: string | null
        }
        Insert: {
          broker_id: string
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          portal_enabled?: boolean | null
          portal_token?: string | null
          updated_at?: string | null
        }
        Update: {
          broker_id?: string
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          portal_enabled?: boolean | null
          portal_token?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      custom_differentiators: {
        Row: {
          appreciation_bonus: number
          category: string
          created_at: string
          id: string
          impacts_appreciation: boolean
          name: string
          name_es: string | null
          tooltip: string | null
          tooltip_es: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          appreciation_bonus?: number
          category?: string
          created_at?: string
          id?: string
          impacts_appreciation?: boolean
          name: string
          name_es?: string | null
          tooltip?: string | null
          tooltip_es?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          appreciation_bonus?: number
          category?: string
          created_at?: string
          id?: string
          impacts_appreciation?: boolean
          name?: string
          name_es?: string | null
          tooltip?: string | null
          tooltip_es?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      developers: {
        Row: {
          created_at: string | null
          description: string | null
          flagship_project: string | null
          founded_year: number | null
          headquarters: string | null
          id: string
          logo_url: string | null
          name: string
          occupancy_rate: number | null
          on_time_delivery_rate: number | null
          projects_launched: number | null
          rating_design: number | null
          rating_flip_potential: number | null
          rating_quality: number | null
          rating_sales: number | null
          rating_track_record: number | null
          score_maintenance: number | null
          short_bio: string | null
          total_valuation: number | null
          units_sold: number | null
          updated_at: string | null
          website: string | null
          white_logo_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          flagship_project?: string | null
          founded_year?: number | null
          headquarters?: string | null
          id?: string
          logo_url?: string | null
          name: string
          occupancy_rate?: number | null
          on_time_delivery_rate?: number | null
          projects_launched?: number | null
          rating_design?: number | null
          rating_flip_potential?: number | null
          rating_quality?: number | null
          rating_sales?: number | null
          rating_track_record?: number | null
          score_maintenance?: number | null
          short_bio?: string | null
          total_valuation?: number | null
          units_sold?: number | null
          updated_at?: string | null
          website?: string | null
          white_logo_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          flagship_project?: string | null
          founded_year?: number | null
          headquarters?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          occupancy_rate?: number | null
          on_time_delivery_rate?: number | null
          projects_launched?: number | null
          rating_design?: number | null
          rating_flip_potential?: number | null
          rating_quality?: number | null
          rating_sales?: number | null
          rating_track_record?: number | null
          score_maintenance?: number | null
          short_bio?: string | null
          total_valuation?: number | null
          units_sold?: number | null
          updated_at?: string | null
          website?: string | null
          white_logo_url?: string | null
        }
        Relationships: []
      }
      exit_presets: {
        Row: {
          created_at: string
          exit_months: Json
          id: string
          minimum_exit_threshold: number
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exit_months?: Json
          id?: string
          minimum_exit_threshold?: number
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exit_months?: Json
          id?: string
          minimum_exit_threshold?: number
          name?: string
          updated_at?: string
          user_id?: string
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
      landmarks: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_url: string
          latitude: number
          longitude: number
          title: string
          updated_at: string
          visible: boolean
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url: string
          latitude: number
          longitude: number
          title: string
          updated_at?: string
          visible?: boolean
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string
          latitude?: number
          longitude?: number
          title?: string
          updated_at?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "landmarks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_views: {
        Row: {
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          ip_address: string | null
          presentation_id: string
          region: string | null
          session_id: string
          started_at: string
          timezone: string | null
          user_agent: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          ip_address?: string | null
          presentation_id: string
          region?: string | null
          session_id: string
          started_at?: string
          timezone?: string | null
          user_agent?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          ip_address?: string | null
          presentation_id?: string
          region?: string | null
          session_id?: string
          started_at?: string
          timezone?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "presentation_views_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: false
            referencedRelation: "presentations"
            referencedColumns: ["id"]
          },
        ]
      }
      presentations: {
        Row: {
          broker_id: string
          client_id: string | null
          created_at: string
          description: string | null
          first_viewed_at: string | null
          id: string
          is_public: boolean
          items: Json
          last_viewed_at: string | null
          share_token: string | null
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          broker_id: string
          client_id?: string | null
          created_at?: string
          description?: string | null
          first_viewed_at?: string | null
          id?: string
          is_public?: boolean
          items?: Json
          last_viewed_at?: string | null
          share_token?: string | null
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          broker_id?: string
          client_id?: string | null
          created_at?: string
          description?: string | null
          first_viewed_at?: string | null
          id?: string
          is_public?: boolean
          items?: Json
          last_viewed_at?: string | null
          share_token?: string | null
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "presentations_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presentations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          business_email: string | null
          commission_rate: number | null
          created_at: string
          default_adr: number | null
          default_adr_growth_rate: number | null
          default_construction_appreciation: number | null
          default_growth_appreciation: number | null
          default_growth_period_years: number | null
          default_mature_appreciation: number | null
          default_mortgage_financing_percent: number | null
          default_mortgage_interest_rate: number | null
          default_mortgage_life_insurance_percent: number | null
          default_mortgage_processing_fee: number | null
          default_mortgage_property_insurance: number | null
          default_mortgage_registration_percent: number | null
          default_mortgage_term_years: number | null
          default_mortgage_valuation_fee: number | null
          default_occupancy_percent: number | null
          default_str_expense_percent: number | null
          default_str_management_percent: number | null
          email: string
          full_name: string | null
          id: string
          language_preference: string | null
          market_dubai_yield: number | null
          market_mortgage_rate: number | null
          market_top_area: string | null
          theme_preference: string | null
          updated_at: string
          whatsapp_country_code: string | null
          whatsapp_number: string | null
        }
        Insert: {
          avatar_url?: string | null
          business_email?: string | null
          commission_rate?: number | null
          created_at?: string
          default_adr?: number | null
          default_adr_growth_rate?: number | null
          default_construction_appreciation?: number | null
          default_growth_appreciation?: number | null
          default_growth_period_years?: number | null
          default_mature_appreciation?: number | null
          default_mortgage_financing_percent?: number | null
          default_mortgage_interest_rate?: number | null
          default_mortgage_life_insurance_percent?: number | null
          default_mortgage_processing_fee?: number | null
          default_mortgage_property_insurance?: number | null
          default_mortgage_registration_percent?: number | null
          default_mortgage_term_years?: number | null
          default_mortgage_valuation_fee?: number | null
          default_occupancy_percent?: number | null
          default_str_expense_percent?: number | null
          default_str_management_percent?: number | null
          email: string
          full_name?: string | null
          id: string
          language_preference?: string | null
          market_dubai_yield?: number | null
          market_mortgage_rate?: number | null
          market_top_area?: string | null
          theme_preference?: string | null
          updated_at?: string
          whatsapp_country_code?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          avatar_url?: string | null
          business_email?: string | null
          commission_rate?: number | null
          created_at?: string
          default_adr?: number | null
          default_adr_growth_rate?: number | null
          default_construction_appreciation?: number | null
          default_growth_appreciation?: number | null
          default_growth_period_years?: number | null
          default_mature_appreciation?: number | null
          default_mortgage_financing_percent?: number | null
          default_mortgage_interest_rate?: number | null
          default_mortgage_life_insurance_percent?: number | null
          default_mortgage_processing_fee?: number | null
          default_mortgage_property_insurance?: number | null
          default_mortgage_registration_percent?: number | null
          default_mortgage_term_years?: number | null
          default_mortgage_valuation_fee?: number | null
          default_occupancy_percent?: number | null
          default_str_expense_percent?: number | null
          default_str_management_percent?: number | null
          email?: string
          full_name?: string | null
          id?: string
          language_preference?: string | null
          market_dubai_yield?: number | null
          market_mortgage_rate?: number | null
          market_top_area?: string | null
          theme_preference?: string | null
          updated_at?: string
          whatsapp_country_code?: string | null
          whatsapp_number?: string | null
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
          hero_image_url: string | null
          hotspot_id: string | null
          id: string
          image_url: string | null
          is_masterplan: boolean | null
          latitude: number | null
          launch_date: string | null
          logo_url: string | null
          longitude: number | null
          name: string | null
          phases: number | null
          price_per_sqft: number | null
          starting_price: number | null
          total_towers: number | null
          total_units: number | null
          total_villas: number | null
          unit_types: string[] | null
          updated_at: string
          zone_id: string | null
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
          hero_image_url?: string | null
          hotspot_id?: string | null
          id?: string
          image_url?: string | null
          is_masterplan?: boolean | null
          latitude?: number | null
          launch_date?: string | null
          logo_url?: string | null
          longitude?: number | null
          name?: string | null
          phases?: number | null
          price_per_sqft?: number | null
          starting_price?: number | null
          total_towers?: number | null
          total_units?: number | null
          total_villas?: number | null
          unit_types?: string[] | null
          updated_at?: string
          zone_id?: string | null
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
          hero_image_url?: string | null
          hotspot_id?: string | null
          id?: string
          image_url?: string | null
          is_masterplan?: boolean | null
          latitude?: number | null
          launch_date?: string | null
          logo_url?: string | null
          longitude?: number | null
          name?: string | null
          phases?: number | null
          price_per_sqft?: number | null
          starting_price?: number | null
          total_towers?: number | null
          total_units?: number | null
          total_villas?: number | null
          unit_types?: string[] | null
          updated_at?: string
          zone_id?: string | null
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
          {
            foreignKeyName: "projects_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_versions: {
        Row: {
          client_country: string | null
          client_email: string | null
          client_name: string | null
          created_at: string
          developer: string | null
          id: string
          inputs: Json
          project_name: string | null
          quote_id: string
          title: string | null
          unit: string | null
          unit_size_m2: number | null
          unit_size_sqf: number | null
          unit_type: string | null
          version_number: number
        }
        Insert: {
          client_country?: string | null
          client_email?: string | null
          client_name?: string | null
          created_at?: string
          developer?: string | null
          id?: string
          inputs: Json
          project_name?: string | null
          quote_id: string
          title?: string | null
          unit?: string | null
          unit_size_m2?: number | null
          unit_size_sqf?: number | null
          unit_type?: string | null
          version_number: number
        }
        Update: {
          client_country?: string | null
          client_email?: string | null
          client_name?: string | null
          created_at?: string
          developer?: string | null
          id?: string
          inputs?: Json
          project_name?: string | null
          quote_id?: string
          title?: string | null
          unit?: string | null
          unit_size_m2?: number | null
          unit_size_sqf?: number | null
          unit_type?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_versions_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "cashflow_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_versions_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "cashflow_quotes_public"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_views: {
        Row: {
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          ip_address: string | null
          quote_id: string
          region: string | null
          session_id: string
          started_at: string
          timezone: string | null
          user_agent: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          ip_address?: string | null
          quote_id: string
          region?: string | null
          session_id: string
          started_at?: string
          timezone?: string | null
          user_agent?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          ip_address?: string | null
          quote_id?: string
          region?: string | null
          session_id?: string
          started_at?: string
          timezone?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_views_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "cashflow_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_views_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "cashflow_quotes_public"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_comparisons: {
        Row: {
          broker_id: string
          created_at: string
          description: string | null
          id: string
          investment_focus: string | null
          is_public: boolean | null
          quote_ids: string[]
          share_token: string | null
          show_recommendations: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          broker_id: string
          created_at?: string
          description?: string | null
          id?: string
          investment_focus?: string | null
          is_public?: boolean | null
          quote_ids: string[]
          share_token?: string | null
          show_recommendations?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          broker_id?: string
          created_at?: string
          description?: string | null
          id?: string
          investment_focus?: string | null
          is_public?: boolean | null
          quote_ids?: string[]
          share_token?: string | null
          show_recommendations?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      secondary_comparisons: {
        Row: {
          broker_id: string
          created_at: string | null
          exit_months: Json
          id: string
          is_public: boolean | null
          quote_id: string | null
          rental_mode: string | null
          secondary_inputs: Json
          share_token: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          broker_id: string
          created_at?: string | null
          exit_months?: Json
          id?: string
          is_public?: boolean | null
          quote_id?: string | null
          rental_mode?: string | null
          secondary_inputs?: Json
          share_token?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          broker_id?: string
          created_at?: string | null
          exit_months?: Json
          id?: string
          is_public?: boolean | null
          quote_id?: string | null
          rental_mode?: string | null
          secondary_inputs?: Json
          share_token?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "secondary_comparisons_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "cashflow_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secondary_comparisons_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "cashflow_quotes_public"
            referencedColumns: ["id"]
          },
        ]
      }
      secondary_properties: {
        Row: {
          airbnb_adr: number | null
          airbnb_management_fee: number | null
          airbnb_occupancy: number | null
          airbnb_operating_expense: number | null
          appreciation_rate: number
          broker_id: string
          closing_costs_percent: number
          created_at: string
          id: string
          mortgage_financing_percent: number
          mortgage_interest_rate: number
          mortgage_term_years: number
          name: string
          purchase_price: number
          rent_growth_rate: number
          rental_yield_percent: number
          service_charge_per_sqft: number
          show_airbnb: boolean
          unit_size_sqf: number
          updated_at: string
          use_mortgage: boolean
        }
        Insert: {
          airbnb_adr?: number | null
          airbnb_management_fee?: number | null
          airbnb_occupancy?: number | null
          airbnb_operating_expense?: number | null
          appreciation_rate?: number
          broker_id: string
          closing_costs_percent?: number
          created_at?: string
          id?: string
          mortgage_financing_percent?: number
          mortgage_interest_rate?: number
          mortgage_term_years?: number
          name: string
          purchase_price?: number
          rent_growth_rate?: number
          rental_yield_percent?: number
          service_charge_per_sqft?: number
          show_airbnb?: boolean
          unit_size_sqf?: number
          updated_at?: string
          use_mortgage?: boolean
        }
        Update: {
          airbnb_adr?: number | null
          airbnb_management_fee?: number | null
          airbnb_occupancy?: number | null
          airbnb_operating_expense?: number | null
          appreciation_rate?: number
          broker_id?: string
          closing_costs_percent?: number
          created_at?: string
          id?: string
          mortgage_financing_percent?: number
          mortgage_interest_rate?: number
          mortgage_term_years?: number
          name?: string
          purchase_price?: number
          rent_growth_rate?: number
          rental_yield_percent?: number
          service_charge_per_sqft?: number
          show_airbnb?: boolean
          unit_size_sqf?: number
          updated_at?: string
          use_mortgage?: boolean
        }
        Relationships: []
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
          concept: string | null
          construction_appreciation: number | null
          created_at: string
          created_by: string | null
          description: string | null
          growth_appreciation: number | null
          growth_period_years: number | null
          id: string
          image_url: string | null
          investment_focus: string | null
          main_developer: string | null
          mature_appreciation: number | null
          maturity_label: string | null
          maturity_level: number | null
          name: string
          occupancy_rate: number | null
          polygon: Json
          population: number | null
          price_range_max: number | null
          price_range_min: number | null
          property_types: string | null
          rent_growth_rate: number | null
          tagline: string | null
          ticket_1br_max: number | null
          ticket_1br_min: number | null
          updated_at: string
          visible: boolean
        }
        Insert: {
          absorption_rate?: number | null
          color?: string
          concept?: string | null
          construction_appreciation?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          growth_appreciation?: number | null
          growth_period_years?: number | null
          id?: string
          image_url?: string | null
          investment_focus?: string | null
          main_developer?: string | null
          mature_appreciation?: number | null
          maturity_label?: string | null
          maturity_level?: number | null
          name: string
          occupancy_rate?: number | null
          polygon: Json
          population?: number | null
          price_range_max?: number | null
          price_range_min?: number | null
          property_types?: string | null
          rent_growth_rate?: number | null
          tagline?: string | null
          ticket_1br_max?: number | null
          ticket_1br_min?: number | null
          updated_at?: string
          visible?: boolean
        }
        Update: {
          absorption_rate?: number | null
          color?: string
          concept?: string | null
          construction_appreciation?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          growth_appreciation?: number | null
          growth_period_years?: number | null
          id?: string
          image_url?: string | null
          investment_focus?: string | null
          main_developer?: string | null
          mature_appreciation?: number | null
          maturity_label?: string | null
          maturity_level?: number | null
          name?: string
          occupancy_rate?: number | null
          polygon?: Json
          population?: number | null
          price_range_max?: number | null
          price_range_min?: number | null
          property_types?: string | null
          rent_growth_rate?: number | null
          tagline?: string | null
          ticket_1br_max?: number | null
          ticket_1br_min?: number | null
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
      cashflow_quotes_public: {
        Row: {
          archived_at: string | null
          broker_id: string | null
          client_id: string | null
          created_at: string | null
          developer: string | null
          first_viewed_at: string | null
          id: string | null
          inputs: Json | null
          is_archived: boolean | null
          last_viewed_at: string | null
          negotiation_started_at: string | null
          presented_at: string | null
          project_name: string | null
          share_token: string | null
          sold_at: string | null
          status: string | null
          status_changed_at: string | null
          title: string | null
          unit: string | null
          unit_size_m2: number | null
          unit_size_sqf: number | null
          unit_type: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          archived_at?: string | null
          broker_id?: string | null
          client_id?: string | null
          created_at?: string | null
          developer?: string | null
          first_viewed_at?: string | null
          id?: string | null
          inputs?: Json | null
          is_archived?: boolean | null
          last_viewed_at?: string | null
          negotiation_started_at?: string | null
          presented_at?: string | null
          project_name?: string | null
          share_token?: string | null
          sold_at?: string | null
          status?: string | null
          status_changed_at?: string | null
          title?: string | null
          unit?: string | null
          unit_size_m2?: number | null
          unit_size_sqf?: number | null
          unit_type?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          archived_at?: string | null
          broker_id?: string | null
          client_id?: string | null
          created_at?: string | null
          developer?: string | null
          first_viewed_at?: string | null
          id?: string | null
          inputs?: Json | null
          is_archived?: boolean | null
          last_viewed_at?: string | null
          negotiation_started_at?: string | null
          presented_at?: string | null
          project_name?: string | null
          share_token?: string | null
          sold_at?: string | null
          status?: string | null
          status_changed_at?: string | null
          title?: string | null
          unit?: string | null
          unit_size_m2?: number | null
          unit_size_sqf?: number | null
          unit_type?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_quotes_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
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
        | "district"
        | "masterplan"
        | "residential"
        | "waterfront"
        | "retail"
        | "leisure"
        | "golf"
        | "infrastructure"
        | "heritage"
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
        "district",
        "masterplan",
        "residential",
        "waterfront",
        "retail",
        "leisure",
        "golf",
        "infrastructure",
        "heritage",
      ],
    },
  },
} as const
