'use client';

import { useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Company, StaffMember, Client, User, Asset } from '@/lib/types';
import { PLAN_CONFIGS, PlanConfig } from '@/lib/plan-configs';

/**
 * Hook para validar límites de plan basados en roles (Admins vs Técnicos) e IoT.
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

  const usersQuery = useMemoFirebase(() => 
    db && profile?.companyId ? collection(db, 'users') : null, 
    [db, profile?.companyId]
  );
  const { data: allUsers } = useCollection<User>(usersQuery);

  const clientsQuery = useMemoFirebase(() => 
    db && profile?.companyId ? collection(db, 'companies', profile.companyId, 'clients') : null, 
    [db, profile?.companyId]
  );
  const { data: clients } = useCollection<Client>(clientsQuery);

  const assetsQuery = useMemoFirebase(() => 
    db && profile?.companyId ? collection(db, 'companies', profile.companyId, 'assets') : null, 
    [db, profile?.companyId]
  );
  const { data: assets } = useCollection<Asset>(assetsQuery);

  const config = useMemo((): PlanConfig => {
    const planId = company?.currentPlan || 'simple';
    return PLAN_CONFIGS[planId as keyof typeof PLAN_CONFIGS] || PLAN_CONFIGS.simple;
  }, [company?.currentPlan]);

  const limits = useMemo(() => {
    const companyUsers = (allUsers || []).filter(u => u.companyId === profile?.companyId);
    
    // Conteo de Administradores (Oficina)
    const adminCount = companyUsers.filter(u => u.role === 'companyAdmin' || u.role === 'supervisor').length;
    
    // Conteo de Técnicos (Terreno)
    const techCount = (staff || []).length;
    
    const clientsCount = (clients || []).length;

    // Conteo de Activos IoT
    const iotAssetsCount = (assets || []).filter(a => a.isIoT).length;

    return {
      canAddAdmin: adminCount < config.maxAdmins,
      canAddTech: techCount < config.maxTechnicians,
      canAddClient: clientsCount < config.maxClients,
      canAddIoT: iotAssetsCount < config.maxIoTAssets,
      canBill: config.features.electronicBilling,
      canUseAI: config.features.genkitAI,
      canUseSignature: config.features.digitalSignature,
      adminCount,
      techCount,
      clientsCount,
      iotAssetsCount,
      maxAdmins: config.maxAdmins,
      maxTechs: config.maxTechnicians,
      maxClients: config.maxClients,
      maxIoT: config.maxIoTAssets,
      features: config.features,
      planName: config.name,
      currentPlanId: config.id
    };
  }, [staff, allUsers, clients, assets, config, profile?.companyId]);

  return limits;
}
