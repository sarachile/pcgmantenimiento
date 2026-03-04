
import { Company, User, WorkOrder, DigitalLogbookEntry, Client } from './types';

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
  },
  {
    id: 'comp-2',
    name: 'Servicios de Minería El Teniente',
    rut: '88.444.222-1',
    address: 'Rancagua, Sector Mina',
    subscriptionPlan: 'enterprise',
    subscriptionStatus: 'active',
    isActive: true,
    createdAt: '2024-02-01T09:30:00Z',
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
  },
  {
    id: 'cli-2',
    companyId: 'comp-1',
    name: 'Edificio Corporativo Central',
    rut: '77.111.333-5',
    address: 'Apoquindo 4500',
    createdAt: '2024-01-25T11:00:00Z',
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
    id: 'user-2',
    email: 'supervisor@mantenciones.cl',
    name: 'Carlos Soto',
    role: 'supervisor',
    companyId: 'comp-1',
    active: true,
    createdAt: '2024-01-16T10:00:00Z',
  },
  {
    id: 'user-3',
    email: 'tecnico@mantenciones.cl',
    name: 'Diego Morales',
    role: 'tecnico',
    companyId: 'comp-1',
    active: true,
    createdAt: '2024-01-17T10:00:00Z',
  },
  {
    id: 'user-4',
    email: 'reviewer@gobierno.cl',
    name: 'Marta Figueroa',
    role: 'reviewer',
    companyId: 'comp-1',
    active: true,
    createdAt: '2024-01-18T10:00:00Z',
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
  },
  {
    id: 'OT-1002',
    companyId: 'comp-1',
    clientId: 'cli-2',
    description: 'Reparación de filtración en tubería de enfriamiento principal.',
    status: 'asignada',
    assignedTo: 'user-3',
    createdByUserId: 'user-2',
    reviewerRequired: false,
    createdAt: '2024-03-21T10:00:00Z',
    updatedAt: '2024-03-21T11:00:00Z',
  },
  {
    id: 'OT-1003',
    companyId: 'comp-1',
    clientId: 'cli-1',
    description: 'Inspección de sistemas contra incendios.',
    status: 'creada',
    createdByUserId: 'user-1',
    reviewerRequired: true,
    createdAt: '2024-03-22T09:00:00Z',
    updatedAt: '2024-03-22T09:00:00Z',
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
  },
  {
    id: 'log-2',
    workOrderId: 'OT-1001',
    companyId: 'comp-1',
    timestamp: '2024-03-20T09:00:00Z',
    eventType: 'status_change',
    eventDetails: 'Orden de trabajo asignada a Diego Morales.',
    actor: 'user-2',
  },
  {
    id: 'log-3',
    workOrderId: 'OT-1001',
    companyId: 'comp-1',
    timestamp: '2024-03-21T14:00:00Z',
    eventType: 'action_taken',
    eventDetails: 'Ejecución completada. Se realizaron pruebas de carga y limpieza de bornes.',
    actor: 'user-3',
  },
  {
    id: 'log-4',
    workOrderId: 'OT-1001',
    companyId: 'comp-1',
    timestamp: '2024-03-21T15:30:00Z',
    eventType: 'status_change',
    eventDetails: 'Enviada a revisión técnica.',
    actor: 'user-3',
  }
];
