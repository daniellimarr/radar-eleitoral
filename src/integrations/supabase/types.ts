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
      appointments: {
        Row: {
          contact_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_time: string | null
          id: string
          is_public: boolean | null
          location: string | null
          start_time: string
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          is_public?: boolean | null
          location?: string | null
          start_time: string
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          is_public?: boolean | null
          location?: string | null
          start_time?: string
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity: string
          entity_id: string | null
          id: string
          ip_address: string | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_materials: {
        Row: {
          created_at: string
          id: string
          name: string
          observations: string | null
          quantity: number | null
          quantity_distributed: number | null
          storage_location: string | null
          tenant_id: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          observations?: string | null
          quantity?: number | null
          quantity_distributed?: number | null
          storage_location?: string | null
          tenant_id: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          observations?: string | null
          quantity?: number | null
          quantity_distributed?: number | null
          storage_location?: string | null
          tenant_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_materials_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          cargo: string
          cidade: string | null
          created_at: string
          estado: string | null
          id: string
          limite_gastos: number | null
          meta_votos: number | null
          nome_campanha: string
          numero: string | null
          partido: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          cargo?: string
          cidade?: string | null
          created_at?: string
          estado?: string | null
          id?: string
          limite_gastos?: number | null
          meta_votos?: number | null
          nome_campanha: string
          numero?: string | null
          partido?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          cargo?: string
          cidade?: string | null
          created_at?: string
          estado?: string | null
          id?: string
          limite_gastos?: number | null
          meta_votos?: number | null
          nome_campanha?: string
          numero?: string | null
          partido?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address: string | null
          address_number: string | null
          birth_date: string | null
          category: string | null
          cep: string | null
          city: string | null
          cpf: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          engagement: Database["public"]["Enums"]["engagement_level"] | null
          gender: string | null
          has_whatsapp: boolean | null
          id: string
          is_leader: boolean | null
          latitude: number | null
          leader_id: string | null
          longitude: number | null
          name: string
          neighborhood: string | null
          nickname: string | null
          observations: string | null
          phone: string | null
          registered_by: string | null
          state: string | null
          subcategory: string | null
          tags: string[] | null
          tenant_id: string
          updated_at: string
          voting_location: string | null
          voting_section: string | null
          voting_zone: string | null
        }
        Insert: {
          address?: string | null
          address_number?: string | null
          birth_date?: string | null
          category?: string | null
          cep?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          engagement?: Database["public"]["Enums"]["engagement_level"] | null
          gender?: string | null
          has_whatsapp?: boolean | null
          id?: string
          is_leader?: boolean | null
          latitude?: number | null
          leader_id?: string | null
          longitude?: number | null
          name: string
          neighborhood?: string | null
          nickname?: string | null
          observations?: string | null
          phone?: string | null
          registered_by?: string | null
          state?: string | null
          subcategory?: string | null
          tags?: string[] | null
          tenant_id: string
          updated_at?: string
          voting_location?: string | null
          voting_section?: string | null
          voting_zone?: string | null
        }
        Update: {
          address?: string | null
          address_number?: string | null
          birth_date?: string | null
          category?: string | null
          cep?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          engagement?: Database["public"]["Enums"]["engagement_level"] | null
          gender?: string | null
          has_whatsapp?: boolean | null
          id?: string
          is_leader?: boolean | null
          latitude?: number | null
          leader_id?: string | null
          longitude?: number | null
          name?: string
          neighborhood?: string | null
          nickname?: string | null
          observations?: string | null
          phone?: string | null
          registered_by?: string | null
          state?: string | null
          subcategory?: string | null
          tags?: string[] | null
          tenant_id?: string
          updated_at?: string
          voting_location?: string | null
          voting_section?: string | null
          voting_zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      content_plans: {
        Row: {
          campaign_id: string | null
          created_at: string
          custo_impulsionamento: number | null
          data_publicacao: string | null
          descricao: string | null
          id: string
          plataforma: string | null
          responsavel_id: string | null
          status: string
          tenant_id: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          custo_impulsionamento?: number | null
          data_publicacao?: string | null
          descricao?: string | null
          id?: string
          plataforma?: string | null
          responsavel_id?: string | null
          status?: string
          tenant_id: string
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          custo_impulsionamento?: number | null
          data_publicacao?: string | null
          descricao?: string | null
          id?: string
          plataforma?: string | null
          responsavel_id?: string | null
          status?: string
          tenant_id?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_plans_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_plans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      demands: {
        Row: {
          contact_id: string | null
          created_at: string
          deadline: string | null
          deleted_at: string | null
          description: string | null
          id: string
          priority: string | null
          resolution: string | null
          responsible_id: string | null
          status: Database["public"]["Enums"]["demand_status"]
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          deadline?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          resolution?: string | null
          responsible_id?: string | null
          status?: Database["public"]["Enums"]["demand_status"]
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          deadline?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          resolution?: string | null
          responsible_id?: string | null
          status?: Database["public"]["Enums"]["demand_status"]
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demands_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demands_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          campaign_id: string | null
          comprovante_url: string | null
          cpf_cnpj: string | null
          created_at: string
          data: string
          forma_pagamento: string | null
          id: string
          nome_doador: string
          tenant_id: string
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          campaign_id?: string | null
          comprovante_url?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          data?: string
          forma_pagamento?: string | null
          id?: string
          nome_doador: string
          tenant_id: string
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Update: {
          campaign_id?: string | null
          comprovante_url?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          data?: string
          forma_pagamento?: string | null
          id?: string
          nome_doador?: string
          tenant_id?: string
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "donations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          campaign_id: string | null
          categoria: string | null
          comprovante_url: string | null
          created_at: string
          data: string
          descricao: string
          evento_id: string | null
          id: string
          supplier_id: string | null
          tenant_id: string
          updated_at: string
          valor: number
        }
        Insert: {
          campaign_id?: string | null
          categoria?: string | null
          comprovante_url?: string | null
          created_at?: string
          data?: string
          descricao: string
          evento_id?: string | null
          id?: string
          supplier_id?: string | null
          tenant_id: string
          updated_at?: string
          valor?: number
        }
        Update: {
          campaign_id?: string | null
          categoria?: string | null
          comprovante_url?: string | null
          created_at?: string
          data?: string
          descricao?: string
          evento_id?: string | null
          id?: string
          supplier_id?: string | null
          tenant_id?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "expenses_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      leaders: {
        Row: {
          contact_id: string
          created_at: string
          engagement_score: number | null
          id: string
          tenant_id: string
          total_contacts: number | null
          updated_at: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          engagement_score?: number | null
          id?: string
          tenant_id: string
          total_contacts?: number | null
          updated_at?: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          engagement_score?: number | null
          id?: string
          tenant_id?: string
          total_contacts?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaders_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          contact_limit: number
          created_at: string
          has_premium_modules: boolean
          id: string
          is_active: boolean
          monthly_price: number
          name: string
          updated_at: string
          user_limit: number
        }
        Insert: {
          contact_limit?: number
          created_at?: string
          has_premium_modules?: boolean
          id?: string
          is_active?: boolean
          monthly_price?: number
          name: string
          updated_at?: string
          user_limit?: number
        }
        Update: {
          contact_limit?: number
          created_at?: string
          has_premium_modules?: boolean
          id?: string
          is_active?: boolean
          monthly_price?: number
          name?: string
          updated_at?: string
          user_limit?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          tenant_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_links: {
        Row: {
          coordinator_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          leader_contact_id: string | null
          slug: string
          tenant_id: string
        }
        Insert: {
          coordinator_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          leader_contact_id?: string | null
          slug: string
          tenant_id: string
        }
        Update: {
          coordinator_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          leader_contact_id?: string | null
          slug?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_links_leader_contact_id_fkey"
            columns: ["leader_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_links_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          contato: string | null
          cpf_cnpj: string | null
          created_at: string
          email: string | null
          endereco: string | null
          id: string
          nome: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          contato?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          contato?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          contact_limit: number
          created_at: string
          deleted_at: string | null
          document: string | null
          id: string
          name: string
          plan_id: string | null
          status: Database["public"]["Enums"]["tenant_status"]
          updated_at: string
        }
        Insert: {
          contact_limit?: number
          created_at?: string
          deleted_at?: string | null
          document?: string | null
          id?: string
          name: string
          plan_id?: string | null
          status?: Database["public"]["Enums"]["tenant_status"]
          updated_at?: string
        }
        Update: {
          contact_limit?: number
          created_at?: string
          deleted_at?: string | null
          document?: string | null
          id?: string
          name?: string
          plan_id?: string | null
          status?: Database["public"]["Enums"]["tenant_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string
          id: string
          module: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          module: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          module?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          brand: string | null
          color: string | null
          created_at: string
          driver_name: string | null
          driver_phone: string | null
          id: string
          model: string | null
          observations: string | null
          plate: string
          status: string | null
          tenant_id: string
          updated_at: string
          year: number | null
        }
        Insert: {
          brand?: string | null
          color?: string | null
          created_at?: string
          driver_name?: string | null
          driver_phone?: string | null
          id?: string
          model?: string | null
          observations?: string | null
          plate: string
          status?: string | null
          tenant_id: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          brand?: string | null
          color?: string | null
          created_at?: string
          driver_name?: string | null
          driver_phone?: string | null
          id?: string
          model?: string | null
          observations?: string | null
          plate?: string
          status?: string | null
          tenant_id?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_requests: {
        Row: {
          approved_by: string | null
          chairs_needed: number | null
          created_at: string
          description: string | null
          id: string
          location: string | null
          material_observations: string | null
          needs_banners: boolean | null
          needs_political_material: boolean | null
          needs_sound: boolean | null
          requested_by: string
          requested_date: string | null
          status: string | null
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          chairs_needed?: number | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          material_observations?: string | null
          needs_banners?: boolean | null
          needs_political_material?: boolean | null
          needs_sound?: boolean | null
          requested_by: string
          requested_date?: string | null
          status?: string | null
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          chairs_needed?: number | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          material_observations?: string | null
          needs_banners?: boolean | null
          needs_political_material?: boolean | null
          needs_sound?: boolean | null
          requested_by?: string
          requested_date?: string | null
          status?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      voter_interactions: {
        Row: {
          contact_id: string
          created_at: string
          data: string
          descricao: string | null
          id: string
          tenant_id: string
          tipo: string
          user_id: string | null
        }
        Insert: {
          contact_id: string
          created_at?: string
          data?: string
          descricao?: string | null
          id?: string
          tenant_id: string
          tipo?: string
          user_id?: string | null
        }
        Update: {
          contact_id?: string
          created_at?: string
          data?: string
          descricao?: string | null
          id?: string
          tenant_id?: string
          tipo?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voter_interactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voter_interactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_automations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          include_variable: string | null
          is_active: boolean
          message_template: string
          name: string
          schedule_time: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          include_variable?: string | null
          is_active?: boolean
          message_template?: string
          name?: string
          schedule_time?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          include_variable?: string | null
          is_active?: boolean
          message_template?: string
          name?: string
          schedule_time?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_automations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_send_logs: {
        Row: {
          automation_id: string | null
          contact_id: string | null
          contact_name: string | null
          created_at: string
          error_message: string | null
          id: string
          message: string | null
          phone: string | null
          sent_at: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          automation_id?: string | null
          contact_id?: string | null
          contact_name?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          message?: string | null
          phone?: string | null
          sent_at?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          automation_id?: string | null
          contact_id?: string | null
          contact_name?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          message?: string | null
          phone?: string | null
          sent_at?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_send_logs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_send_logs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_send_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_tenant_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin_gabinete"
        | "coordenador"
        | "assessor"
        | "operador"
      demand_status: "aberta" | "em_andamento" | "concluida" | "cancelada"
      engagement_level:
        | "nao_trabalhado"
        | "em_prospeccao"
        | "conquistado"
        | "criando_envolvimento"
        | "falta_trabalhar"
        | "envolvimento_perdido"
      tenant_status: "ativo" | "suspenso" | "cancelado"
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
      app_role: [
        "super_admin",
        "admin_gabinete",
        "coordenador",
        "assessor",
        "operador",
      ],
      demand_status: ["aberta", "em_andamento", "concluida", "cancelada"],
      engagement_level: [
        "nao_trabalhado",
        "em_prospeccao",
        "conquistado",
        "criando_envolvimento",
        "falta_trabalhar",
        "envolvimento_perdido",
      ],
      tenant_status: ["ativo", "suspenso", "cancelado"],
    },
  },
} as const
