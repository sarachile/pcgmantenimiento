
export type Role = 'companyAdmin' | 'supervisor' | 'tecnico' | 'reviewer' | 'superadmin';

export type OTStatus = 'creada' | 'asignada' | 'ejecutada' | 'en revision' | 'aprobada' | 'rechazada';

export type AssetStatus = 'activo' | 'inactivo' | 'en mantenimiento';

export type DTEStatus = 'pendiente' | 'enviado' | 'error' | 'aceptado_sii';

export type DTEType = 'factura' | 'boleta' | 'guia';

export type PlanType = 'free' | 'pro' | 'enterprise';

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled';

export interface Company {
  id: string;
  name: string;
  rut: string;
  address: string;
  currentPlan: PlanType;
  subscriptionStatus: SubscriptionStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  companyId: string;
  isActive: boolean;
  createdAt: string;
}

export interface Subscription {
  id: string;
  plan: PlanType;
  status: SubscriptionStatus;
  startDate: string;
  endDate?: string;
  billingCycle: 'monthly' | 'yearly';
}

export interface UsageStats {
  activeUsersCount: number;
  workOrdersCreatedMonth: number;
  invoicesIssuedMonth: number;
  lastResetDate: string;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  paymentMethod: string;
  transactionId?: string;
  createdAt: string;
}

export interface Asset {
  id: string;
  companyId: string;
  name: string;
  code: string;
  location: string;
  status: AssetStatus;
  lastMaintenanceAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SparePart {
  id: string;
  companyId: string;
  name: string;
  code: string;
  currentStock: number;
  minStock: number;
  unit: string;
}

export interface WorkOrder {
  id: string;
  companyId: string;
  assetId?: string;
  description: string;
  status: OTStatus;
  assignedToUserId?: string;
  createdByUserId: string;
  reviewerId?: string;
  reviewerRequired: boolean;
  createdAt: string;
  updatedAt: string;
  executedAt?: string;
  reviewedAt?: string;
  approvedByUserId?: string;
  rejectedReason?: string;
  evidenceUrls?: string[];
}

export interface DigitalLogbookEntry {
  id: string;
  workOrderId: string;
  timestamp: string;
  eventType: 'status_change' | 'action_taken' | 'comment' | 'system_alert';
  eventDetails: string;
  actorUserId: string;
}

export interface Invoice {
  id: string;
  companyId: string;
  workOrderId: string;
  issuerUserId: string;
  status: DTEStatus;
  dteType: DTEType;
  folio?: number;
  amount: number;
  simpleApiId?: string;
  errorDetails?: string;
  pdfUrl?: string;
  xmlUrl?: string;
  createdAt: string;
}
