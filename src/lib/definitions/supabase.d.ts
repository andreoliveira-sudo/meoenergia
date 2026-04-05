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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          scopes: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          scopes?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          scopes?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      api_logs: {
        Row: {
          api_key_id: string | null
          created_at: string | null
          duration_ms: number | null
          id: string
          ip_address: string | null
          method: string
          path: string
          status_code: number
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string | null
          duration_ms?: number | null
          id?: string
          ip_address?: string | null
          method: string
          path: string
          status_code: number
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          api_key_id?: string | null
          created_at?: string | null
          duration_ms?: number | null
          id?: string
          ip_address?: string | null
          method?: string
          path?: string
          status_code?: number
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          annual_revenue: number | null
          city: string
          cnpj: string
          company_name: string
          complement: string | null
          cpf: string | null
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at: string
          created_by_user_id: string
          deleted_at: string | null
          id: string
          incorporation_date: string | null
          internal_manager: string | null
          kdi: number
          name: string | null
          neighborhood: string
          number: string
          partner_id: string | null
          postal_code: string
          state: string
          street: string
          type: Database["public"]["Enums"]["customer_type"]
          updated_at: string
        }
        Insert: {
          annual_revenue?: number | null
          city: string
          cnpj: string
          company_name: string
          complement?: string | null
          cpf?: string | null
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at?: string
          created_by_user_id?: string
          deleted_at?: string | null
          id?: string
          incorporation_date?: string | null
          internal_manager?: string | null
          kdi?: number
          name?: string | null
          neighborhood: string
          number: string
          partner_id?: string | null
          postal_code: string
          state: string
          street: string
          type?: Database["public"]["Enums"]["customer_type"]
          updated_at?: string
        }
        Update: {
          annual_revenue?: number | null
          city?: string
          cnpj?: string
          company_name?: string
          complement?: string | null
          cpf?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          created_at?: string
          created_by_user_id?: string
          deleted_at?: string | null
          id?: string
          incorporation_date?: string | null
          internal_manager?: string | null
          kdi?: number
          name?: string | null
          neighborhood?: string
          number?: string
          partner_id?: string | null
          postal_code?: string
          state?: string
          street?: string
          type?: Database["public"]["Enums"]["customer_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_internal_manager_fkey"
            columns: ["internal_manager"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_brands: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      equipment_types: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      equipments: {
        Row: {
          brand_id: string | null
          created_at: string
          deleted_at: string | null
          id: number
          name: string
          type_id: string
          updated_at: string
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: number
          name: string
          type_id: string
          updated_at?: string
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: number
          name?: string
          type_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "equipment_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "equipment_types"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          deleted_at: string | null
          group_id: string
          joined_at: string
          role: string | null
          user_id: string
        }
        Insert: {
          deleted_at?: string | null
          group_id: string
          joined_at?: string
          role?: string | null
          user_id: string
        }
        Update: {
          deleted_at?: string | null
          group_id?: string
          joined_at?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      group_rules: {
        Row: {
          created_at: string
          deleted_at: string | null
          entity: string
          group_id: string | null
          id: string
          rule_type: string
          target_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          entity: string
          group_id?: string | null
          id?: string
          rule_type: string
          target_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          entity?: string
          group_id?: string | null
          id?: string
          rule_type?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_rules_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_rules_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          created_by_user_id: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          channel: string
          content: string | null
          created_at: string | null
          error_message: string | null
          id: string
          order_id: string | null
          recipient_email: string | null
          recipient_name: string | null
          recipient_phone: string | null
          status: string | null
          triggered_by_user_id: string | null
        }
        Insert: {
          channel: string
          content?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          order_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          status?: string | null
          triggered_by_user_id?: string | null
        }
        Update: {
          channel?: string
          content?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          order_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          status?: string | null
          triggered_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_triggered_by_user_id_fkey"
            columns: ["triggered_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          active: boolean | null
          category: string | null
          content: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          trigger_key: string | null
          updated_at: string | null
          whatsapp_text: string | null
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          content: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          trigger_key?: string | null
          updated_at?: string | null
          whatsapp_text?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string | null
          content?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          trigger_key?: string | null
          updated_at?: string | null
          whatsapp_text?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          content: string
          created_at: string | null
          id: string
          link: string | null
          read: boolean | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          link?: string | null
          read?: boolean | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          link?: string | null
          read?: boolean | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      order_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          new_status: string
          old_status: string | null
          order_id: string
          reason: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_status: string
          old_status?: string | null
          order_id: string
          reason?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_status?: string
          old_status?: string | null
          order_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          }
        ]
      }
      orders: {
        Row: {
          connection_voltage: string
          created_at: string
          created_by_user_id: string | null
          deleted_at: string | null
          current_consumption: number
          customer_id: string
          energy_provider: string
          equipment_value: number
          id: string
          interest_rate: number | null
          interest_rate_36: number
          interest_rate_48: number
          interest_rate_60: number
          kdi: number
          kit_inverter_id: number
          kit_module_id: number
          kit_others: number | null
          labor_value: number
          notes: string | null
          other_costs: number | null
          seller_id: string | null
          service_fee: number | null
          service_fee_36: number
          service_fee_48: number
          service_fee_60: number
          status: Database["public"]["Enums"]["enum_order_status"]
          order_status: Database["public"]["Enums"]["enum_order_workflow_status"] | null
          structure_type: string
          financing_term: number
          monthly_bill_value: number
          payment_day: number
          system_power: number
          updated_at: string
        }
        Insert: {
          connection_voltage: string
          created_at?: string
          created_by_user_id?: string | null
          deleted_at?: string | null
          current_consumption: number
          customer_id: string
          energy_provider: string
          equipment_value: number
          id?: string
          interest_rate?: number | null
          interest_rate_36?: number
          interest_rate_48?: number
          interest_rate_60?: number
          kdi?: number
          kit_inverter_id: number
          kit_module_id: number
          kit_others?: number | null
          labor_value: number
          notes?: string | null
          other_costs?: number | null
          seller_id?: string | null
          service_fee?: number | null
          financing_term?: number
          monthly_bill_value?: number
          payment_day?: number
          service_fee_36: number
          service_fee_48: number
          service_fee_60: number
          status?: Database["public"]["Enums"]["enum_order_status"]
          order_status?: Database["public"]["Enums"]["enum_order_workflow_status"] | null
          structure_type: string
          system_power: number
          updated_at?: string
        }
        Update: {
          connection_voltage?: string
          created_at?: string
          created_by_user_id?: string | null
          deleted_at?: string | null
          current_consumption?: number
          customer_id?: string
          energy_provider?: string
          equipment_value?: number
          id?: string
          interest_rate?: number | null
          interest_rate_36?: number
          interest_rate_48?: number
          interest_rate_60?: number
          kdi?: number
          kit_inverter_id?: number
          kit_module_id?: number
          kit_others?: number | null
          labor_value?: number
          notes?: string | null
          other_costs?: number | null
          seller_id?: string | null
          service_fee?: number | null
          financing_term?: number
          monthly_bill_value?: number
          payment_day?: number
          service_fee_36?: number
          service_fee_48?: number
          service_fee_60?: number
          status?: Database["public"]["Enums"]["enum_order_status"]
          order_status?: Database["public"]["Enums"]["enum_order_workflow_status"] | null
          structure_type?: string
          system_power?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_kit_inverter_fkey"
            columns: ["kit_inverter_id"]
            isOneToOne: false
            referencedRelation: "equipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_kit_module_fkey"
            columns: ["kit_module_id"]
            isOneToOne: false
            referencedRelation: "equipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_kit_others_fkey"
            columns: ["kit_others"]
            isOneToOne: false
            referencedRelation: "equipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_structure_type_fkey"
            columns: ["structure_type"]
            isOneToOne: false
            referencedRelation: "structure_types"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_users: {
        Row: {
          created_at: string
          partner_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          partner_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          partner_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_users_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          cep: string
          city: string
          cnpj: string
          complement: string | null
          contact_email: string
          contact_mobile: string
          contact_name: string
          created_at: string
          deleted_at: string | null
          id: string
          is_active: boolean
          kdi: number
          legal_business_name: string
          neighborhood: string
          number: string
          seller_id: string | null
          state: string
          status: Database["public"]["Enums"]["enum_partners_status"]
          street: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cep: string
          city: string
          cnpj: string
          complement?: string | null
          contact_email: string
          contact_mobile: string
          contact_name: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          kdi?: number
          legal_business_name: string
          neighborhood: string
          number: string
          seller_id?: string | null
          state: string
          status?: Database["public"]["Enums"]["enum_partners_status"]
          street: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cep?: string
          city?: string
          cnpj?: string
          complement?: string | null
          contact_email?: string
          contact_mobile?: string
          contact_name?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          kdi?: number
          legal_business_name?: string
          neighborhood?: string
          number?: string
          seller_id?: string | null
          state?: string
          status?: Database["public"]["Enums"]["enum_partners_status"]
          street?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partners_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partners_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          description: string
          id: string
        }
        Insert: {
          description: string
          id: string
        }
        Update: {
          description?: string
          id?: string
        }
        Relationships: []
      }
      rates: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          id: string
          updated_at?: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      rls_violation_audit: {
        Row: {
          attempted_row_id: string | null
          created_at: string | null
          id: string
          ip_address: unknown
          operation: string
          reason: string | null
          table_name: string
          user_id: string
        }
        Insert: {
          attempted_row_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          operation: string
          reason?: string | null
          table_name: string
          user_id: string
        }
        Update: {
          attempted_row_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          operation?: string
          reason?: string | null
          table_name?: string
          user_id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          permission_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          permission_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          permission_id?: string
          role?: Database["public"]["Enums"]["user_role"]
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
      sellers: {
        Row: {
          cep: string
          city: string
          complement: string | null
          cpf: string
          created_at: string | null
          deleted_at: string | null
          email: string
          id: string
          is_active: boolean
          name: string
          neighborhood: string
          number: string
          phone: string
          state: string
          status: Database["public"]["Enums"]["enum_partners_status"]
          street: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cep: string
          city: string
          complement?: string | null
          cpf: string
          created_at?: string | null
          deleted_at?: string | null
          email: string
          id?: string
          is_active?: boolean
          name: string
          neighborhood: string
          number: string
          phone: string
          state: string
          status?: Database["public"]["Enums"]["enum_partners_status"]
          street: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cep?: string
          city?: string
          complement?: string | null
          cpf?: string
          created_at?: string | null
          deleted_at?: string | null
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          neighborhood?: string
          number?: string
          phone?: string
          state?: string
          status?: Database["public"]["Enums"]["enum_partners_status"]
          street?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sellers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      simulations: {
        Row: {
          connection_voltage: string | null
          created_at: string
          created_by_user_id: string | null
          deleted_at: string | null
          current_consumption: number
          customer_id: string | null
          energy_provider: string | null
          equipment_value: number | null
          id: string
          interest_rate: number | null
          interest_rate_36: number | null
          interest_rate_48: number | null
          interest_rate_60: number | null
          kdi: number
          kit_inverter_id: number | null
          kit_module_id: number | null
          kit_others: number | null
          labor_value: number | null
          notes: string | null
          other_costs: number | null
          result: Json | null
          seller_id: string | null
          service_fee: number | null
          service_fee_36: number | null
          service_fee_48: number | null
          service_fee_60: number | null
          status: Database["public"]["Enums"]["enum_simulation_status"]
          structure_type: string | null
          system_power: number | null
          updated_at: string
        }
        Insert: {
          connection_voltage: string | null
          created_at?: string
          created_by_user_id?: string | null
          deleted_at?: string | null
          current_consumption: number
          customer_id?: string | null
          energy_provider?: string | null
          equipment_value?: number | null
          id?: string
          interest_rate?: number | null
          interest_rate_36?: number | null
          interest_rate_48?: number | null
          interest_rate_60?: number | null
          kdi?: number
          kit_inverter_id?: number | null
          kit_module_id?: number | null
          kit_others?: number | null
          labor_value?: number | null
          notes?: string | null
          other_costs?: number | null
          result?: Json | null
          seller_id?: string | null
          service_fee?: number | null
          service_fee_36?: number | null
          service_fee_48?: number | null
          service_fee_60?: number | null
          status?: Database["public"]["Enums"]["enum_simulation_status"]
          structure_type?: string | null
          system_power?: number | null
          updated_at?: string
        }
        Update: {
          connection_voltage?: string | null
          created_at?: string
          created_by_user_id?: string | null
          deleted_at?: string | null
          current_consumption?: number
          customer_id?: string | null
          energy_provider?: string | null
          equipment_value?: number | null
          id?: string
          interest_rate?: number | null
          interest_rate_36?: number | null
          interest_rate_48?: number | null
          interest_rate_60?: number | null
          kdi?: number
          kit_inverter_id?: number | null
          kit_module_id?: number | null
          kit_others?: number | null
          labor_value?: number | null
          notes?: string | null
          other_costs?: number | null
          result?: Json | null
          seller_id?: string | null
          service_fee?: number | null
          service_fee_36?: number | null
          service_fee_48?: number | null
          service_fee_60?: number | null
          status?: Database["public"]["Enums"]["enum_simulation_status"]
          structure_type?: string | null
          system_power?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulations_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulations_kit_inverter_fkey"
            columns: ["kit_inverter_id"]
            isOneToOne: false
            referencedRelation: "equipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulations_kit_module_fkey"
            columns: ["kit_module_id"]
            isOneToOne: false
            referencedRelation: "equipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulations_kit_others_fkey"
            columns: ["kit_others"]
            isOneToOne: false
            referencedRelation: "equipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulations_structure_type_fkey"
            columns: ["structure_type"]
            isOneToOne: false
            referencedRelation: "structure_types"
            referencedColumns: ["id"]
          },
        ]
      }
      structure_types: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          label: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_category_members: {
        Row: {
          category_id: string
          created_at: string
          is_primary: boolean
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          is_primary?: boolean
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          is_primary?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_category_members_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "user_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_category_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          has_permission: boolean
          permission_id: string
          user_id: string
        }
        Insert: {
          has_permission: boolean
          permission_id?: string
          user_id: string
        }
        Update: {
          has_permission?: boolean
          permission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          cep: string
          city: string
          complement: string | null
          cpf: string
          created_at: string
          is_active: boolean
          neighborhood: string
          number: string
          phone: string
          state: string
          street: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cep: string
          city: string
          complement?: string | null
          cpf: string
          created_at?: string
          is_active?: boolean
          neighborhood: string
          number: string
          phone: string
          state: string
          street: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cep?: string
          city?: string
          complement?: string | null
          cpf?: string
          created_at?: string
          is_active?: boolean
          neighborhood?: string
          number?: string
          phone?: string
          state?: string
          street?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          is_active?: boolean
          name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_user_with_auth: { Args: { target_user_id: string }; Returns: Json }
      get_user_permissions_detailed: {
        Args: { p_user_id: string }
        Returns: {
          description: string
          effective: boolean
          permission_id: string
        }[]
      }
      has_permission: { Args: { p_permission_id: string }; Returns: boolean }
    }
    Enums: {
      customer_type: "pf" | "pj"
      enum_order_status:
      | "analysis_pending"
      | "analysis_approved"
      | "analysis_rejected"
      | "documents_pending"
      | "docs_analysis"
      | "sending_distributor_invoice"
      | "payment_distributor"
      | "access_opinion"
      | "initial_payment_integrator"
      | "final_payment_integrator"
      | "finished"
      | "canceled"
      enum_order_workflow_status:
      | "in_review"
      | "rejected"
      | "documents_pending"
      | "docs_analysis"
      | "documents_issue"
      | "awaiting_signature"
      | "awaiting_distributor_docs"
      | "analyzing_distributor_docs"
      | "distributor_docs_issue"
      | "equipment_separation"
      | "equipment_transit"
      | "equipment_delivered"
      | "awaiting_integrator_docs"
      | "analyzing_integrator_docs"
      | "integrator_docs_issue"
      | "finished"
      | "canceled"
      enum_partners_status: "pending" | "approved" | "rejected"
      enum_simulation_status:
      | "initial_contact"
      | "under_review"
      | "in_negotiation"
      | "won"
      | "lost"
      user_role: "partner" | "seller" | "admin" | "staff"
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
      customer_type: ["pf", "pj"],
      enum_order_status: [
        "analysis_pending",
        "analysis_approved",
        "analysis_rejected",
        "documents_pending",
        "docs_analysis",
        "sending_distributor_invoice",
        "payment_distributor",
        "access_opinion",
        "initial_payment_integrator",
        "final_payment_integrator",
        "finished",
        "canceled",
      ],
      enum_partners_status: ["pending", "approved", "rejected"],
      enum_simulation_status: [
        "initial_contact",
        "under_review",
        "in_negotiation",
        "won",
        "lost",
      ],
      user_role: ["partner", "seller", "admin", "staff"],
    },
  },
} as const
