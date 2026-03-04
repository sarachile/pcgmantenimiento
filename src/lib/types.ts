
export type Role = 'companyAdmin' | 'supervisor' | 'tecnico' | 'reviewer' | 'superadmin';

export type OTStatus = 'creada' | 'asignada' | 'ejecutada' | 'en revision' | 'aprobada' | 'rechazada';

export type AssetStatus = 'activo' | 'inactivo' | 'en mantenimiento';

export interface Company {
  id: string;
  name: string;
  rut: string;
  address: string;
  currentPlan: 'free' | 'pro' | 'enterprise';
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

export interface PartUsage {
  id: string;
  workOrderId: string;
  partId: string;
  quantity: number;
  usedAt: string;
  actorUserId: string;
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

export interface Review {
  id: string;
  workOrderId: string;
  reviewerId: string;
  status: 'approved' | 'rejected';
  comments: string;
  createdAt: string;
}
