
export type Role = 'companyAdmin' | 'supervisor' | 'tecnico' | 'reviewer' | 'superadmin';

export type OTStatus = 'creada' | 'asignada' | 'ejecutada' | 'en revision' | 'pendiente cliente' | 'aprobada' | 'rechazada';

export type AssetStatus = 'activo' | 'inactivo' | 'en mantenimiento';

export type DTEStatus = 'pendiente' | 'enviado' | 'error' | 'aceptado_sii';

export type PlanType = 'free' | 'pro' | 'enterprise';

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled';

export interface Company {
  id: string;
  name: string;
  rut: string;
  address: string;
  logoUrl?: string;
  currentPlan: PlanType;
  subscriptionStatus: SubscriptionStatus;
  isActive: boolean;
  createdAt: string | any;
  updatedAt?: string | any;
  requestedPlan?: string;
}

export interface Client {
  id: string;
  companyId: string;
  name: string;
  rut: string;
  address: string;
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
  role: string; // Técnico, Especialista, Subcontrato, Supervisor, etc.
  identification?: string; // RUT o ID interno
  phone?: string;
  email?: string;
  active: boolean;
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
}

export interface EvaluationRatings {
  quality: number;
  timing: number;
  safety: number;
  documentation: number;
}

export interface ServiceEvaluation {
  id: string;
  workOrderId: string;
  clientId: string;
  companyId: string;
  reviewerId: string;
  reviewerName: string;
  ratings: EvaluationRatings;
  comment: string;
  adminResponse?: string;
  adminResponseAt?: string | any;
  createdAt: string | any;
}

export interface WorkOrder {
  id: string;
  companyId: string;
  clientId: string;
  assetId?: string;
  description: string;
  status: OTStatus;
  assignedToStaffIds?: string[];
  createdByUserId: string;
  reviewerRequired: boolean;
  scheduledDate?: string | any;
  durationDays?: number;
  estimatedEndDate?: string | any;
  checklist?: ChecklistItem[];
  clientSignatureUrl?: string;
  technicianSignatureUrl?: string;
  // Campos para firma digital simple
  clientApprovalName?: string;
  clientApprovalDate?: string | any;
  clientApprovalCode?: string;
  createdAt: string | any;
  updatedAt: string | any;
  executedAt?: string | any;
  reviewedAt?: string | any;
  approvedByUserId?: string;
  rejectedReason?: string;
  evidenceUrls?: string[];
  aiSummary?: string;
  evaluationId?: string;
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
