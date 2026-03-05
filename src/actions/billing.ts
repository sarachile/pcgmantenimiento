
'use server';

/**
 * @fileOverview Acción de servidor para la integración REAL con SimpleAPI (DTE Chile).
 * Soporta modo Sandbox (Certificación) y Producción.
 */

const SIMPLE_API_URL = "https://api.simpleapi.cl/api/v1/dte/generar"; 
const SIMPLE_API_KEY = process.env.SIMPLE_API_KEY || "";

interface EmissionResponse {
  success: boolean;
  folio?: number;
  pdfUrl?: string;
  xmlUrl?: string;
  error?: string;
  status?: 'aceptado_sii' | 'error' | 'rechazado';
}

/**
 * Procesa la emisión de un DTE hacia SimpleAPI.
 * @param docData Datos del documento (items, totales, etc.)
 * @param emisorData Datos de la empresa que emite (SaaS Tenant)
 * @param isSandbox Define si se envía al ambiente de certificación del SII
 */
export async function processElectronicEmission(docData: any, emisorData: any, isSandbox: boolean = true): Promise<EmissionResponse> {
  console.log(`Iniciando emisión ${isSandbox ? 'TEST' : 'PROD'} para:`, docData.clientName);

  if (!SIMPLE_API_KEY) {
    return {
      success: false,
      error: "Error de configuración: SIMPLE_API_KEY no definida en el servidor .env"
    };
  }

  // Mapeo de tipos internos a códigos SII oficiales
  const dteTypeMap: Record<string, number> = {
    'factura': 33,
    'boleta': 39,
    'guia_despacho': 52,
    'nota_credito': 61
  };

  const tipoDTE = dteTypeMap[docData.type] || 33;

  try {
    /**
     * ESTRUCTURA DE PAYLOAD PARA SIMPLEAPI:
     * Se construye el objeto siguiendo el esquema requerido por SimpleAPI para Chile.
     */
    const payload = {
      token: SIMPLE_API_KEY,
      reemplazar: true, 
      rutEmisor: emisorData.rut,
      ambiente: isSandbox ? 0 : 1, // 0 = Certificación (Test), 1 = Producción
      dte: {
        Encabezado: {
          IdDoc: {
            TipoDTE: tipoDTE,
            FchEmis: new Date().toISOString().split('T')[0],
            IndServicio: 3 
          },
          Emisor: {
            RUTEmisor: emisorData.rut,
            RznSoc: emisorData.name,
            Giro: "Servicios de Mantenimiento",
            DirOrigen: emisorData.address,
            CmnaOrigen: "Santiago", 
          },
          Receptor: {
            RUTRecep: docData.clientRut,
            RznSocRecep: docData.clientName,
            GiroRecep: "Giro Cliente", 
            DirRecep: docData.clientAddress || "S/I",
            CmnaRecep: "S/I"
          },
          Totales: {
            MntNeto: docData.netAmount,
            TasaIVA: 19,
            IVA: docData.taxAmount,
            MntTotal: docData.totalAmount
          }
        },
        Detalle: docData.items.map((it: any, index: number) => ({
          NroLinDet: index + 1,
          NmbItem: it.description,
          QtyItem: it.quantity,
          PrcItem: it.unitPrice,
          MntItem: it.total
        }))
      }
    };

    const response = await fetch(SIMPLE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.ok && result.status === "OK") {
      return {
        success: true,
        folio: result.folio,
        status: 'aceptado_sii',
        pdfUrl: result.urlPdf,
        xmlUrl: result.urlXml
      };
    } else {
      console.error("SimpleAPI Error Response:", result);
      return {
        success: false,
        error: result.message || "El SII rechazó el documento o hubo un error de firma.",
        status: 'error'
      };
    }

  } catch (error: any) {
    console.error("Error crítico en comunicación con SimpleAPI:", error);
    return {
      success: false,
      error: "Error de conexión con el servidor de facturación electrónica."
    };
  }
}
