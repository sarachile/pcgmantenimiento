
export type Role = 'companyAdmin' | 'supervisor' | 'tecnico' | 'reviewer' | 'superadmin';

export type OTStatus = 'creada' | 'asignada' | 'ejecutada' | 'en revision' | 'aprobada' | 'rechazada';

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
  subscriptionPlan: PlanType;
  subscriptionStatus: SubscriptionStatus;
  isActive: boolean;
  createdAt: string | any;
  updatedAt?: string | any;
}

export interface Client {
  id: string;
  companyId: string;
  name: string;
  rut: string;
  address: string;
  contactName?: string;
  contactEmail?: string;
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

export interface WorkOrder {
  id: string;
  companyId: string;
  clientId: string;
  assetId?: string;
  description: string;
  status: OTStatus;
  assignedTo?: string;
  assignedToUserId?: string;
  createdByUserId: string;
  reviewerId?: string;
  reviewerRequired: boolean;
  checklist?: ChecklistItem[];
  clientSignatureUrl?: string;
  technicianSignatureUrl?: string;
  createdAt: string | any;
  updatedAt: string | any;
  executedAt?: string | any;
  reviewedAt?: string | any;
  approvedByUserId?: string;
  rejectedReason?: string;
  evidenceUrls?: string[];
  aiSummary?: string;
}

export interface Invoice {
  id: string;
  companyId: string;
  clientId: string;
  workOrderId: string;
  amount: number;
  status: DTEStatus;
  simpleApiId?: string;
  pdfUrl?: string;
  xmlUrl?: string;
  issuedBy: string;
  issuedAt: string | any;
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
