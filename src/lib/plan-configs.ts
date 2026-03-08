import { PlanType } from "./types";

/**
 * @fileOverview Definición maestra de límites y funcionalidades por plan.
 * Se implementa la estrategia de "Valor por Rol": Administradores (Gestión) vs Técnicos (Ejecución).
 * ACTUALIZACIÓN: Se ajusta el límite de Enterprise a 50 IoT. Mayores volúmenes vía comercial.
 */

export interface PlanConfig {
  id: PlanType;
  name: string;
  maxAdmins: number;      // Administradores / Supervisores
  maxTechnicians: number; // Personal en terreno
  maxClients: number;
  maxIoTAssets: number;   // Límite de activos con sensores conectados
  maxMonthlyOrders: number;
  storageLimitMb: number;
  features: {
    digitalSignature: boolean;
    offlineMode: boolean;
    genkitAI: boolean;
    multiBranch: boolean;
    customChecklists: boolean;
    electronicBilling: boolean;
    apiAccess: boolean; 
  };
}

export const PLAN_CONFIGS: Record<PlanType, PlanConfig> = {
  simple: {
    id: 'simple',
    name: 'Plan Simple (Inicio)',
    maxAdmins: 1,
    maxTechnicians: 2,
    maxClients: 5,
    maxIoTAssets: 0,
    maxMonthlyOrders: 30,
    storageLimitMb: 500,
    features: {
      digitalSignature: false,
      offlineMode: false,
      genkitAI: false,
      multiBranch: false,
      customChecklists: true,
      electronicBilling: false,
      apiAccess: false,
    }
  },
  business: {
    id: 'business',
    name: 'Plan Business (Escala)',
    maxAdmins: 3,
    maxTechnicians: 15,
    maxClients: 50,
    maxIoTAssets: 10,
    maxMonthlyOrders: 200,
    storageLimitMb: 5000,
    features: {
      digitalSignature: true,
      offlineMode: true,
      genkitAI: true,
      multiBranch: false,
      customChecklists: true,
      electronicBilling: true,
      apiAccess: true,
    }
  },
  enterprise: {
    id: 'enterprise',
    name: 'Plan Enterprise (Poder)',
    maxAdmins: 10,
    maxTechnicians: 50,
    maxClients: 200,
    maxIoTAssets: 50,
    maxMonthlyOrders: 5000,
    storageLimitMb: 50000,
    features: {
      digitalSignature: true,
      offlineMode: true,
      genkitAI: true,
      multiBranch: true,
      customChecklists: true,
      electronicBilling: true,
      apiAccess: true,
    }
  }
};
