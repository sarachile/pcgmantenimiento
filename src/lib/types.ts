
export type Role = 'companyAdmin' | 'supervisor' | 'tecnico' | 'reviewer' | 'superadmin';

export type OTStatus = 'solicitada' | 'creada' | 'asignada' | 'ejecutada' | 'en revision' | 'pendiente cliente' | 'aprobada' | 'rechazada';

export type AssetStatus = 'activo' | 'inactivo' | 'en mantenimiento';

export type DTEStatus = 'pendiente' | 'emitido' | 'anulado' | 'error' | 'aceptado_sii';

export type BillingDocumentType = 'factura' | 'boleta' | 'guia_despacho' | 'nota_credito';

export type PlanType = 'simple' | 'business' | 'enterprise';

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled';

export interface Company {
  id: string;
  name: string;
  rut: string;
  address: string;
  giro?: string;
  comuna?: string;
  logoUrl?: string;
  currentPlan: PlanType;
  subscriptionStatus: SubscriptionStatus;
  isActive: boolean;
  createdAt: string | any;
  updatedAt?: string | any;
  requestedPlan?: string;
  // Métricas de control para límites
  metrics?: {
    usedStorageMb: number;
    monthlyOrdersCount: number;
    currentMonth: string; // Formato YYYY-MM para resetear contadores
  };
}

export interface Client {
  id: string;
  companyId: string;
  name: string;
  rut: string;
  address: string;
  giro?: string;
  comuna?: string;
  contactName?: string;
  contactEmail?: string;
  evaluationEnabled: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  companyId: string;
  active: boolean;
  createdAt: string;
}

export interface StaffMember {
  id: string;
  companyId: string;
  name: string;
  role: string; 
  identification?: string; 
  phone?: string;
  email?: string;
  active: boolean;
  createdAt: string | any;
}

export interface Team {
  id: string;
  companyId: string;
  name: string;
  memberIds: string[];
  leaderId?: string;
  createdAt: string | any;
}

export interface Asset {
  id: string;
  companyId: string;
  name: string;
  code: string;
  location: string;
  status: AssetStatus;
  lastMaintenanceAt?: string | any;
  createdAt: string | any;
}

export interface SparePart {
  id: string;
  companyId: string;
  name: string;
  sku: string;
  stockActual: number;
  stockMinimo: number;
  unitPrice: number;
}

export interface PartUsage {
  id: string;
  workOrderId: string;
  partId: string;
  partName: string;
  quantity: number;
  unitPrice: number;
  usedAt: string | any;
}

export interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  completedAt?: string | any;
  evidenceUrl?: string;
}

export interface WorkOrder {
  id: string;
  companyId: string;
  clientId: string;
  assetId?: string;
  description: string;
  serviceLocation?: string;
  requestedByName?: string;
  status: OTStatus;
  assignedToStaffIds?: string[];
  assignedTeamId?: string;
  createdByUserId: string;
  reviewerRequired: boolean;
  evaluationRequired: boolean;
  approvalPin?: string; 
  scheduledDate?: string | any;
  durationDays?: number;
  estimatedEndDate?: string | any;
  serviceQuantity?: number;
  serviceUnit?: string;
  checklist?: ChecklistItem[];
  clientApprovalName?: string;
  clientApprovalDate?: string | any;
  clientApprovalCode?: string;
  technicianApprovalName?: string;
  technicianApprovalDate?: string | any;
  technicianApprovalCode?: string;
  createdAt: string | any;
  updatedAt: string | any;
  executedAt?: string | any;
  evidenceUrls?: string[];
  aiSummary?: string;
  evaluationId?: string;
  source?: 'internal' | 'external';
  requestedByEmail?: string;
  urgency?: 'low' | 'medium' | 'high';
}

export interface DigitalLogbookEntry {
  id: string;
  workOrderId: string;
  companyId: string;
  timestamp: string | any;
  eventType: 'status_change' | 'action_taken' | 'comment' | 'system_alert';
  eventDetails: string;
  actor: string;
}
