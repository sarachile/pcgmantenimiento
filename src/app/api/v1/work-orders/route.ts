
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';

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

    // 1. Validar Empresa y Plan (Simulado: en un caso real buscaríamos el apiKey en la colección de empresas)
    // Para el demo, permitimos si el companyId es válido
    const companyRef = doc(firestore, "companies", companyId);
    const companySnap = await getDoc(companyRef);

    if (!companySnap.exists()) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    const companyData = companySnap.data();
    if (companyData.currentPlan !== 'enterprise') {
      return NextResponse.json({ error: 'El acceso API requiere Plan Enterprise' }, { status: 403 });
    }

    // 2. Generar PIN de aprobación único
    const pin = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Crear la Orden de Trabajo con origen 'sensor' o 'api'
    const otCol = collection(firestore, "companies", companyId, "workOrders");
    const docRef = await addDoc(otCol, {
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

    // 4. Registrar en Bitácora
    const logCol = collection(firestore, "companies", companyId, "workOrders", docRef.id, "digitalLogbookEntries");
    await addDoc(logCol, {
      workOrderId: docRef.id,
      companyId,
      timestamp: serverTimestamp(),
      eventType: 'system_alert',
      eventDetails: `Orden creada automáticamente vía API externa. Origen: ${urgency === 'high' ? 'Alerta de Sensor' : 'Sistema Integrado'}.`,
      actor: "API_GATEWAY"
    });

    return NextResponse.json({
      success: true,
      workOrderId: docRef.id,
      status: 'creada',
      message: 'Orden de trabajo generada exitosamente'
    });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
