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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          company_name: string | null
          role: 'requester' | 'reviewer' | 'supplier' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          company_name?: string | null
          role?: 'requester' | 'reviewer' | 'supplier' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          company_name?: string | null
          role?: 'requester' | 'reviewer' | 'supplier' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          tier: 'free' | 'basic' | 'pro' | 'enterprise'
          status: 'active' | 'cancelled' | 'expired' | 'trial'
          current_period_start: string
          current_period_end: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          project_limit: number
          projects_used: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tier?: 'free' | 'basic' | 'pro' | 'enterprise'
          status?: 'active' | 'cancelled' | 'expired' | 'trial'
          current_period_start?: string
          current_period_end?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          project_limit?: number
          projects_used?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tier?: 'free' | 'basic' | 'pro' | 'enterprise'
          status?: 'active' | 'cancelled' | 'expired' | 'trial'
          current_period_start?: string
          current_period_end?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          project_limit?: number
          projects_used?: number
          created_at?: string
          updated_at?: string
        }
      }
      catalogs: {
        Row: {
          id: string
          name: string
          description: string | null
          supplier_name: string
          supplier_contact: Json | null
          is_public: boolean
          created_by: string | null
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          supplier_name: string
          supplier_contact?: Json | null
          is_public?: boolean
          created_by?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          supplier_name?: string
          supplier_contact?: Json | null
          is_public?: boolean
          created_by?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          catalog_id: string
          sku: string
          name: string
          brand: string
          category: 'plumbing' | 'lighting' | 'appliances' | 'hvac' | 'electrical' | 'hardware'
          subcategory: string | null
          description: string | null
          price: number | null
          image_url: string | null
          additional_images: Json | null
          finish_options: Json | null
          specifications: Json | null
          purchase_url: string | null
          spec_sheet_url: string | null
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          catalog_id: string
          sku: string
          name: string
          brand: string
          category: 'plumbing' | 'lighting' | 'appliances' | 'hvac' | 'electrical' | 'hardware'
          subcategory?: string | null
          description?: string | null
          price?: number | null
          image_url?: string | null
          additional_images?: Json | null
          finish_options?: Json | null
          specifications?: Json | null
          purchase_url?: string | null
          spec_sheet_url?: string | null
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          catalog_id?: string
          sku?: string
          name?: string
          brand?: string
          category?: 'plumbing' | 'lighting' | 'appliances' | 'hvac' | 'electrical' | 'hardware'
          subcategory?: string | null
          description?: string | null
          price?: number | null
          image_url?: string | null
          additional_images?: Json | null
          finish_options?: Json | null
          specifications?: Json | null
          purchase_url?: string | null
          spec_sheet_url?: string | null
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          client_name: string | null
          client_email: string | null
          status: 'draft' | 'questionnaire' | 'generating' | 'review' | 'approved' | 'exported'
          catalog_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          client_name?: string | null
          client_email?: string | null
          status?: 'draft' | 'questionnaire' | 'generating' | 'review' | 'approved' | 'exported'
          catalog_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          client_name?: string | null
          client_email?: string | null
          status?: 'draft' | 'questionnaire' | 'generating' | 'review' | 'approved' | 'exported'
          catalog_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      project_files: {
        Row: {
          id: string
          project_id: string
          file_name: string
          file_type: 'pdf' | 'image'
          file_url: string
          file_size: number
          page_type: 'floor_plan' | 'elevation' | 'mep' | 'rcp' | 'other' | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          project_id: string
          file_name: string
          file_type: 'pdf' | 'image'
          file_url: string
          file_size: number
          page_type?: 'floor_plan' | 'elevation' | 'mep' | 'rcp' | 'other' | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          file_name?: string
          file_type?: 'pdf' | 'image'
          file_url?: string
          file_size?: number
          page_type?: 'floor_plan' | 'elevation' | 'mep' | 'rcp' | 'other' | null
          uploaded_at?: string
        }
      }
      questionnaires: {
        Row: {
          id: string
          project_id: string
          categories_selected: Json
          energy_type: 'electric' | 'gas' | 'hybrid' | 'solar' | null
          fuel_preferences: Json | null
          style: string | null
          finish_colors: Json | null
          preferred_brands: Json | null
          room_list: Json
          category_budgets: Json | null
          constraints: Json | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          categories_selected?: Json
          energy_type?: 'electric' | 'gas' | 'hybrid' | 'solar' | null
          fuel_preferences?: Json | null
          style?: string | null
          finish_colors?: Json | null
          preferred_brands?: Json | null
          room_list?: Json
          category_budgets?: Json | null
          constraints?: Json | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          categories_selected?: Json
          energy_type?: 'electric' | 'gas' | 'hybrid' | 'solar' | null
          fuel_preferences?: Json | null
          style?: string | null
          finish_colors?: Json | null
          preferred_brands?: Json | null
          room_list?: Json
          category_budgets?: Json | null
          constraints?: Json | null
          completed_at?: string | null
          created_at?: string
        }
      }
      selections: {
        Row: {
          id: string
          project_id: string
          product_id: string
          room_name: string
          quantity: number
          finish: string | null
          notes: string | null
          is_locked: boolean
          unit_price: number | null
          extended_price: number | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          product_id: string
          room_name: string
          quantity?: number
          finish?: string | null
          notes?: string | null
          is_locked?: boolean
          unit_price?: number | null
          extended_price?: number | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          product_id?: string
          room_name?: string
          quantity?: number
          finish?: string | null
          notes?: string | null
          is_locked?: boolean
          unit_price?: number | null
          extended_price?: number | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      generated_packages: {
        Row: {
          id: string
          project_id: string
          selection_book_url: string | null
          quote_sheet_url: string | null
          total_amount: number | null
          version: number
          generated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          selection_book_url?: string | null
          quote_sheet_url?: string | null
          total_amount?: number | null
          version?: number
          generated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          selection_book_url?: string | null
          quote_sheet_url?: string | null
          total_amount?: number | null
          version?: number
          generated_at?: string
        }
      }
      collaborators: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: 'reviewer' | 'editor' | 'viewer'
          invited_at: string
          accepted_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role: 'reviewer' | 'editor' | 'viewer'
          invited_at?: string
          accepted_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role?: 'reviewer' | 'editor' | 'viewer'
          invited_at?: string
          accepted_at?: string | null
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
