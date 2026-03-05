
'use client';

import { useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Company, StaffMember, Client } from '@/lib/types';
import { PLAN_CONFIGS, PlanConfig } from '@/lib/plan-configs';

/**
 * Hook para validar límites de plan en tiempo real en la UI.
 */
export function usePlanLimits() {
  const { profile } = useUser();
  const db = useFirestore();

  const companyRef = useMemoFirebase(() => 
    db && profile?.companyId ? doc(db, 'companies', profile.companyId) : null, 
    [db, profile?.companyId]
  );
  const { data: company } = useDoc<Company>(companyRef);

  const staffQuery = useMemoFirebase(() => 
    db && profile?.companyId ? collection(db, 'companies', profile.companyId, 'staff') : null, 
    [db, profile?.companyId]
  );
  const { data: staff } = useCollection<StaffMember>(staffQuery);

  const clientsQuery = useMemoFirebase(() => 
    db && profile?.companyId ? collection(db, 'companies', profile.companyId, 'clients') : null, 
    [db, profile?.companyId]
  );
  const { data: clients } = useCollection<Client>(clientsQuery);

  const config = useMemo((): PlanConfig => {
    const planId = company?.currentPlan || 'simple';
    return PLAN_CONFIGS[planId as keyof typeof PLAN_CONFIGS] || PLAN_CONFIGS.simple;
  }, [company?.currentPlan]);

  const limits = useMemo(() => {
    const staffCount = staff?.length || 0;
    const clientsCount = clients?.length || 0;

    return {
      canAddStaff: staffCount < config.maxTechnicians,
      canAddClient: clientsCount < config.maxClients,
      canBill: config.features.electronicBilling,
      canUseAI: config.features.genkitAI,
      canUseSignature: config.features.digitalSignature,
      staffCount,
      clientsCount,
      maxStaff: config.maxTechnicians,
      maxClients: config.maxClients,
      features: config.features,
      planName: config.name,
      currentPlanId: config.id
    };
  }, [staff, clients, config]);

  return limits;
}
