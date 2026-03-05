
'use server';

/**
 * @fileOverview Acción de servidor para la integración con SimpleAPI (DTE Chile).
 * Este archivo centraliza el envío de documentos al SII y la gestión de respuestas.
 */

// NOTA: En un entorno real, estas variables deben estar en .env
const SIMPLE_API_URL = "https://api.simpleapi.cl/api/v1"; 
const SIMPLE_API_KEY = process.env.SIMPLE_API_KEY || "YOUR_API_KEY_HERE";

interface EmissionResponse {
  success: boolean;
  folio?: number;
  pdfUrl?: string;
  xmlUrl?: string;
  error?: string;
  status?: 'aceptado_sii' | 'error';
}

/**
 * Procesa la emisión de un DTE hacia la API externa.
 */
export async function processElectronicEmission(docData: any): Promise<EmissionResponse> {
  console.log("Iniciando emisión electrónica para:", docData.clientName);

  // Mapeo de tipos internos a códigos SII
  const dteTypeMap: Record<string, number> = {
    'factura': 33,
    'boleta': 39,
    'guia_despacho': 52,
    'nota_credito': 61
  };

  const tipoDTE = dteTypeMap[docData.type] || 33;

  try {
    /**
     * ESTRUCTURA PARA SIMPLEAPI (EJEMPLO):
     * Aquí se construiría el JSON exacto que requiere el endpoint de la API.
     */
    const payload = {
      tipoDTE,
      receptor: {
        rut: docData.clientRut,
        razonSocial: docData.clientName,
        direccion: docData.clientAddress || "S/I",
      },
      items: docData.items.map((it: any) => ({
        nombre: it.description,
        cantidad: it.quantity,
        precio: it.unitPrice
      })),
      totales: {
        montoNeto: docData.netAmount,
        iva: docData.taxAmount,
        montoTotal: docData.totalAmount
      }
    };

    // SIMULACIÓN DE LLAMADA A API (2 segundos de latencia)
    // En producción aquí iría: 
    // const response = await fetch(`${SIMPLE_API_URL}/emitir`, { ... });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Supongamos que la API responde con éxito y nos da un folio
    const simulatedFolio = Math.floor(Math.random() * 5000) + 100;

    return {
      success: true,
      folio: simulatedFolio,
      status: 'aceptado_sii',
      pdfUrl: `https://cdn.simpleapi.cl/temp/pdf_${simulatedFolio}.pdf`,
      xmlUrl: `https://cdn.simpleapi.cl/temp/xml_${simulatedFolio}.xml`
    };

  } catch (error: any) {
    console.error("Error crítico en emisión SimpleAPI:", error);
    return {
      success: false,
      error: error.message || "Error de comunicación con el servidor de facturación."
    };
  }
}
