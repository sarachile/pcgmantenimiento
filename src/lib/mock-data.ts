
import { Company, User, WorkOrder, DigitalLogbookEntry, Client, Asset, SparePart } from './types';

export const MOCK_COMPANIES: Company[] = [
  {
    id: 'comp-1',
    name: 'Mantenciones Industriales Chile S.A.',
    rut: '76.123.456-K',
    address: 'Av. Las Condes 1234, Santiago',
    subscriptionPlan: 'pro',
    subscriptionStatus: 'active',
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
  }
];

export const MOCK_CLIENTS: Client[] = [
  {
    id: 'cli-1',
    companyId: 'comp-1',
    name: 'Planta Norte Industrial',
    rut: '76.888.222-1',
    address: 'Ruta 5 Norte KM 40',
    contactName: 'Marta Figueroa',
    contactEmail: 'marta@plantanorte.cl',
    createdAt: '2024-01-20T10:00:00Z',
  }
];

export const MOCK_ASSETS: Asset[] = [
  {
    id: 'ast-1',
    companyId: 'comp-1',
    name: 'Compresor Industrial Atlas Copco',
    code: 'COMP-001',
    location: 'Sala de Máquinas A',
    status: 'activo',
    lastMaintenanceAt: '2024-02-15T08:00:00Z',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'ast-2',
    companyId: 'comp-1',
    name: 'Bomba Hidráulica 5HP',
    code: 'BOMB-024',
    location: 'Planta 2, Sector 4',
    status: 'en mantenimiento',
    lastMaintenanceAt: '2024-03-01T10:00:00Z',
    createdAt: '2024-01-20T11:00:00Z',
  }
];

export const MOCK_SPARE_PARTS: SparePart[] = [
  {
    id: 'prt-1',
    companyId: 'comp-1',
    name: 'Filtro de Aceite X-40',
    sku: 'SKU-001-FIL',
    stockActual: 15,
    stockMinimo: 5,
    unitPrice: 12500,
  },
  {
    id: 'prt-2',
    companyId: 'comp-1',
    name: 'Correa de Distribución B-2',
    sku: 'SKU-002-COR',
    stockActual: 2,
    stockMinimo: 10,
    unitPrice: 45000,
  }
];

export const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    email: 'admin@mantenciones.cl',
    name: 'Juan Pérez',
    role: 'companyAdmin',
    companyId: 'comp-1',
    active: true,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'user-3',
    email: 'tecnico@mantenciones.cl',
    name: 'Diego Morales',
    role: 'tecnico',
    companyId: 'comp-1',
    active: true,
    createdAt: '2024-01-17T10:00:00Z',
  }
];

export const MOCK_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'OT-1001',
    companyId: 'comp-1',
    clientId: 'cli-1',
    description: 'Mantenimiento preventivo de transformador T-400 en Planta Norte.',
    status: 'en revision',
    assignedTo: 'user-3',
    createdByUserId: 'user-2',
    reviewerRequired: true,
    createdAt: '2024-03-20T08:00:00Z',
    updatedAt: '2024-03-21T15:30:00Z',
    executedAt: '2024-03-21T14:00:00Z',
  }
];

export const MOCK_LOGBOOK: DigitalLogbookEntry[] = [
  {
    id: 'log-1',
    workOrderId: 'OT-1001',
    companyId: 'comp-1',
    timestamp: '2024-03-20T08:00:00Z',
    eventType: 'status_change',
    eventDetails: 'Orden de trabajo creada.',
    actor: 'user-2',
  }
];
