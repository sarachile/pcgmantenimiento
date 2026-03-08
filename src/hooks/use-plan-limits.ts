'use client';

import { useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Company, StaffMember, Client, User } from '@/lib/types';
import { PLAN_CONFIGS, PlanConfig } from '@/lib/plan-configs';

/**
 * Hook para validar límites de plan basados en roles (Admins vs Técnicos).
 */
export function usePlanLimits() {
  const { profile } = useUser();
  const db = useFirestore();

  const companyRef = useMemoFirebase(() => 
    db && profile?.companyId ? doc(db, 'companies', profile.companyId) : null, 
    [db, profile?.companyId]
  );
  const { data: company } = useDoc<Company>(companyRef);

  // Consultamos tanto el staff (técnicos registrados) como los usuarios de la plataforma
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

  const config = useMemo((): PlanConfig => {
    const planId = company?.currentPlan || 'simple';
    return PLAN_CONFIGS[planId as keyof typeof PLAN_CONFIGS] || PLAN_CONFIGS.simple;
  }, [company?.currentPlan]);

  const limits = useMemo(() => {
    const companyUsers = (allUsers || []).filter(u => u.companyId === profile?.companyId);
    
    // Conteo de Administradores (Oficina)
    const adminCount = companyUsers.filter(u => u.role === 'companyAdmin' || u.role === 'supervisor').length;
    
    // Conteo de Técnicos (Terreno) - Contamos los que están en la ficha de staff
    const techCount = (staff || []).length;
    
    const clientsCount = (clients || []).length;

    return {
      canAddAdmin: adminCount < config.maxAdmins,
      canAddTech: techCount < config.maxTechnicians,
      canAddClient: clientsCount < config.maxClients,
      canBill: config.features.electronicBilling,
      canUseAI: config.features.genkitAI,
      canUseSignature: config.features.digitalSignature,
      adminCount,
      techCount,
      clientsCount,
      maxAdmins: config.maxAdmins,
      maxTechs: config.maxTechnicians,
      maxClients: config.maxClients,
      features: config.features,
      planName: config.name,
      currentPlanId: config.id
    };
  }, [staff, allUsers, clients, config, profile?.companyId]);

  return limits;
}
