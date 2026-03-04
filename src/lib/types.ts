
export type Role = 'companyAdmin' | 'supervisor' | 'tecnico' | 'reviewer' | 'superadmin';

export type OTStatus = 'creada' | 'asignada' | 'ejecutada' | 'en revision' | 'aprobada' | 'rechazada';

export interface Company {
  id: string;
  name: string;
  rut: string;
  address: string;
  subscriptionPlan: 'basic' | 'pro' | 'enterprise';
  subscriptionStatus: 'active' | 'inactive' | 'pending';
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  companyId: string;
  active: boolean;
}

export interface WorkOrder {
  id: string;
  companyId: string;
  description: string;
  status: OTStatus;
  assignedTo?: string; // User ID
  createdBy: string; // User ID
  createdAt: string;
  updatedAt: string;
  executedAt?: string;
  reviewedAt?: string;
  approvedBy?: string;
  rejectedReason?: string;
}

export interface DigitalLogbookEntry {
  id: string;
  workOrderId: string;
  companyId: string;
  timestamp: string;
  eventType: 'status_change' | 'action_taken' | 'comment' | 'system_alert';
  eventDetails: string;
  actor: string; // User ID
}
