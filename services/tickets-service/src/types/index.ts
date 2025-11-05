/**
 * TypeScript type definitions
 */

import { Request } from 'express';

// User context (forwarded from Gateway/Auth service)
export interface AuthUser {
  id: string;
  tenant_id: string;
  email: string;
  role: string;
  permissions: string[];
}

// Extend Express Request to include user
export interface AuthRequest extends Request {
  user?: AuthUser;
}

// Ticket entity
export interface Ticket {
  id: string;
  tenant_id: string;
  ticket_number: number;
  customer_id: string;
  contact_id?: string;
  location_id?: string;
  contract_id?: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'assigned' | 'in_progress' | 'waiting_customer' | 'waiting_vendor' | 'resolved' | 'closed' | 'cancelled';
  category?: string;
  subcategory?: string;
  assigned_to?: string;
  assigned_team?: string;
  sla_id?: string;
  sla_response_due?: Date;
  sla_resolution_due?: Date;
  sla_breached: boolean;
  sla_breach_reason?: string;
  first_response_at?: Date;
  resolved_at?: Date;
  closed_at?: Date;
  parent_ticket_id?: string;
  custom_fields?: Record<string, any>;
  tags?: string[];
  source?: 'email' | 'portal' | 'phone' | 'rmm_alert' | 'api';
  source_reference?: string;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  deleted_at?: Date;
}

// Time Entry entity
export interface TimeEntry {
  id: string;
  tenant_id: string;
  ticket_id?: string;
  project_task_id?: string;
  user_id: string;
  date: Date;
  hours: number;
  description: string;
  notes?: string;
  work_type?: 'support' | 'project' | 'consulting' | 'emergency';
  billable: boolean;
  billed: boolean;
  invoice_id?: string;
  billing_rate: number;
  cost_rate?: number;
  created_at: Date;
  updated_at: Date;
}

// Comment entity
export interface Comment {
  id: string;
  tenant_id: string;
  ticket_id?: string;
  project_id?: string;
  user_id: string;
  content: string;
  is_internal: boolean;
  is_resolution: boolean;
  attachments?: any[];
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

// Ticket Attachment entity
export interface TicketAttachment {
  id: string;
  tenant_id: string;
  ticket_id: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  file_path: string;
  uploaded_by: string;
  created_at: Date;
}

// SLA entity
export interface SLA {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  response_time_hours: number;
  resolution_time_hours: number;
  business_hours_only: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Filters
export interface TicketFilters {
  status?: string;
  priority?: string;
  assigned_to?: string;
  customer_id?: string;
  search?: string;
  sla_breached?: boolean;
  created_from?: Date;
  created_to?: Date;
}

// Rate resolution result
export interface ResolvedRates {
  billing_rate: number;
  cost_rate: number;
}
