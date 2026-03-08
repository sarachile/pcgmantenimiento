
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
  apiKey?: string; // Llave para integraciones externas
  createdAt: string | any;
  updatedAt?: string | any;
  trialEndsAt?: string | any;
  requestedPlan?: string;
  metrics?: {
    usedStorageMb: number;
    monthlyOrdersCount: number;
    currentMonth: string;
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
  staffId?: string;
  isStaffAccount?: boolean;
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
  hasAccount?: boolean;
  userId?: string;
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
  assetId?: string | null;
  description: string;
  serviceLocation?: string;
  requestedByName?: string;
  status: OTStatus;
  assignedToStaffIds?: string[];
  assignedTeamId?: string | null;
  createdByUserId: string;
  reviewerRequired: boolean;
  evaluationRequired: boolean;
  approvalPin?: string; 
  scheduledDate?: string | any;
  durationDays?: number;
  estimatedEndDate?: string | any;
  serviceQuantity?: number | null;
  serviceUnit?: string | null;
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
  source?: 'internal' | 'external' | 'api' | 'sensor'; // Tracking de origen
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

export interface BillingDocument {
  id: string;
  companyId: string;
  clientId: string;
  clientName: string;
  clientRut: string;
  clientAddress?: string;
  workOrderId?: string | null;
  type: BillingDocumentType;
  status: DTEStatus;
  items: BillingItem[];
  netAmount: number;
  taxAmount: number;
  totalAmount: number;
  folio?: number;
  pdfUrl?: string;
  xmlUrl?: string;
  isSandbox?: boolean;
  createdAt: string | any;
  updatedAt: string | any;
}

export interface BillingItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ServiceEvaluation {
  id: string;
  workOrderId: string;
  clientId: string;
  companyId: string;
  reviewerId: string;
  reviewerName: string;
  ratings: {
    quality: number;
    timing: number;
    safety: number;
    documentation: number;
  };
  comment: string;
  adminResponse?: string;
  adminResponseAt?: string | any;
  createdAt: string | any;
}

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'user';
  text: string;
  timestamp: string | any;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  companyId: string;
  companyName: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: 'technical' | 'billing' | 'feature' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string | any;
  updatedAt: string | any;
}
