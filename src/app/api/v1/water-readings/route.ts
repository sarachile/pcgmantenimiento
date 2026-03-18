import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  serverTimestamp, 
  addDoc,
  limit,
  getDoc
} from 'firebase/firestore';

/**
 * @fileOverview Endpoint de Ingesta de Telemetría IoT.
 * Recibe lecturas de las Antenas Maestras y las distribuye a los medidores.
 */

export async function POST(request: Request) {
  const { firestore } = initializeFirebase();
  const apiKey = request.headers.get('x-api-key');

  if (!apiKey) {
    return NextResponse.json({ error: 'Falta x-api-key en encabezados' }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const { meterId, value, batteryLevel, signalStrength, unitIdentifier } = payload;

    // Validación mínima de datos industriales
    if (!meterId || value === undefined) {
      return NextResponse.json({ error: 'Payload incompleto: se requiere meterId y value' }, { status: 400 });
    }

    // 1. Buscar empresa por API Key (Tenant Isolation)
    const companiesRef = collection(firestore, "companies");
    const q = query(companiesRef, where("apiKey", "==", apiKey), limit(1));
    const companySnap = await getDocs(q);

    if (companySnap.empty) {
      return NextResponse.json({ error: 'API Key no autorizada o empresa inactiva' }, { status: 403 });
    }

    const companyDoc = companySnap.docs[0];
    const companyId = companyDoc.id;

    // 2. Referencia al Medidor
    const meterRef = doc(firestore, "companies", companyId, "waterMeters", meterId);
    const meterDoc = await getDoc(meterRef);
    
    /**
     * LÓGICA DE DETECCIÓN DE FUGAS (Edge Intelligence Simulation)
     * Si la lectura instantánea es mayor a un umbral (ej: 0.8 m3/pulso), 
     * marcamos alerta de fuga. En producción esto usaría comparativas horarias.
     */
    const hasLeak = value > 0.8; 

    // 3. Actualizar Medidor (Auto-enrolamiento si no existe)
    await setDoc(meterRef, {
      id: meterId,
      companyId,
      currentReading: value,
      batteryLevel: batteryLevel ?? 100,
      signalStrength: signalStrength ?? 100,
      hasLeakAlert: hasLeak,
      lastCommunication: serverTimestamp(),
      // Mantenemos el identificador original si ya existe, sino usamos el enviado
      unitIdentifier: meterDoc.exists() ? meterDoc.data().unitIdentifier : (unitIdentifier ?? `ID: ${meterId.slice(-6).toUpperCase()}`),
      status: meterDoc.exists() ? meterDoc.data().status : "open"
    }, { merge: true });

    // 4. Registrar Lectura en el Histórico (Serie Temporal)
    const readingsCol = collection(firestore, "companies", companyId, "waterMeters", meterId, "readings");
    await addDoc(readingsCol, {
      meterId,
      value,
      timestamp: serverTimestamp()
    });

    return NextResponse.json({ 
      success: true, 
      status: 'processed',
      leakAlert: hasLeak,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("IoT Ingestion Error:", error);
    return NextResponse.json({ error: 'Error interno del servidor de telemetría' }, { status: 500 });
  }
}
