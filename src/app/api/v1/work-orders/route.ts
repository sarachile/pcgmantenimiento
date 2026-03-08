
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, setDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';

/**
 * @fileOverview Endpoint para la creación de OTs vía API/Sensores IoT.
 * Permite que sistemas externos generen requerimientos técnicos automáticamente.
 */

export async function POST(request: Request) {
  const { firestore } = initializeFirebase();
  const apiKey = request.headers.get('x-api-key');

  if (!apiKey) {
    return NextResponse.json({ error: 'Falta x-api-key en los encabezados' }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const { companyId, clientId, assetId, description, urgency } = payload;

    if (!companyId || !clientId || !description) {
      return NextResponse.json({ error: 'Faltan campos obligatorios: companyId, clientId, description' }, { status: 400 });
    }

    const companyRef = doc(firestore, "companies", companyId);
    const companySnap = await getDoc(companyRef);

    if (!companySnap.exists()) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    const companyData = companySnap.data();
    if (companyData.currentPlan === 'simple') {
      return NextResponse.json({ error: 'El acceso API requiere Plan Business o Superior' }, { status: 403 });
    }

    // GENERACIÓN DE ID CORTO PROFESIONAL
    const shortId = `OT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const pin = Math.floor(100000 + Math.random() * 900000).toString();

    const otRef = doc(firestore, "companies", companyId, "workOrders", shortId);
    
    await setDoc(otRef, {
      id: shortId,
      companyId,
      clientId,
      assetId: assetId || null,
      description: description,
      status: "creada",
      source: urgency === 'high' ? 'sensor' : 'api',
      urgency: urgency || 'medium',
      createdByUserId: "system_api",
      approvalPin: pin,
      checklist: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Registrar en Bitácora con identificación del autor
    const logCol = collection(firestore, "companies", companyId, "workOrders", shortId, "digitalLogbookEntries");
    await setDoc(doc(logCol), {
      workOrderId: shortId,
      companyId,
      timestamp: serverTimestamp(),
      eventType: 'system_alert',
      eventDetails: `Orden creada automáticamente vía API externa. Origen: ${urgency === 'high' ? 'Alerta de Sensor' : 'Sistema Integrado'}.`,
      actor: "API_GATEWAY",
      actorName: "Sistema API"
    });

    return NextResponse.json({
      success: true,
      workOrderId: shortId,
      status: 'creada',
      message: 'Orden de trabajo generada exitosamente'
    });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
