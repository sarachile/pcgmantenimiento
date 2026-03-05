
import { PlanType } from "./types";

/**
 * @fileOverview Definición maestra de límites y funcionalidades por plan.
 * Esta es la "Fuente de Verdad" para la lógica de negocio.
 */

export interface PlanConfig {
  id: PlanType;
  name: string;
  maxTechnicians: number;
  maxClients: number;
  maxMonthlyOrders: number;
  storageLimitMb: number;
  features: {
    digitalSignature: boolean;
    offlineMode: boolean;
    genkitAI: boolean;
    multiBranch: boolean;
    customChecklists: boolean;
    electronicBilling: boolean; // Nuevo: Facturación DTE
  };
}

export const PLAN_CONFIGS: Record<PlanType, PlanConfig> = {
  simple: {
    id: 'simple',
    name: 'Plan Simple',
    maxTechnicians: 2,
    maxClients: 5,
    maxMonthlyOrders: 30,
    storageLimitMb: 500,
    features: {
      digitalSignature: false,
      offlineMode: false,
      genkitAI: false,
      multiBranch: false,
      customChecklists: true,
      electronicBilling: false,
    }
  },
  business: {
    id: 'business',
    name: 'Plan Business',
    maxTechnicians: 10,
    maxClients: 25,
    maxMonthlyOrders: 200,
    storageLimitMb: 5000,
    features: {
      digitalSignature: true,
      offlineMode: true,
      genkitAI: true,
      multiBranch: false,
      customChecklists: true,
      electronicBilling: true,
    }
  },
  enterprise: {
    id: 'enterprise',
    name: 'Plan Enterprise',
    maxTechnicians: 100,
    maxClients: 1000,
    maxMonthlyOrders: 5000,
    storageLimitMb: 50000,
    features: {
      digitalSignature: true,
      offlineMode: true,
      genkitAI: true,
      multiBranch: true,
      customChecklists: true,
      electronicBilling: true,
    }
  }
};
