'use server';

import { cleanRutForAPI, validateRut } from "@/lib/utils-rut";

/**
 * @fileOverview Integración segura con SimpleAPI para emisión de DTE Chile.
 * SEGURIDAD: El Token de API se maneja exclusivamente en el lado del servidor.
 */

const SIMPLE_API_URL = "https://api.simpleapi.cl/api/v1/dte/generar"; 
const SIMPLE_API_KEY = process.env.SIMPLE_API_KEY;

interface EmissionResponse {
  success: boolean;
  folio?: number;
  pdfUrl?: string;
  xmlUrl?: string;
  error?: string;
  status?: 'aceptado_sii' | 'error' | 'rechazado';
}

export async function processElectronicEmission(docData: any, emisorData: any, isSandbox: boolean = true): Promise<EmissionResponse> {
  // 1. Verificación de Seguridad: La API Key debe existir
  if (!SIMPLE_API_KEY) {
    return {
      success: false,
      error: "Error de infraestructura: SIMPLE_API_KEY no configurada. Añada la clave en el panel de Secretos."
    };
  }

  // 2. Validación de Datos Legales (Pre-vuelo)
  if (!validateRut(emisorData.rut)) {
    return { success: false, error: "RUT de emisor inválido. Corrija su perfil en 'Mi Empresa'." };
  }
  if (!validateRut(docData.clientRut)) {
    return { success: false, error: "RUT de receptor inválido. Corrija la ficha del cliente." };
  }

  const rutEmisor = cleanRutForAPI(emisorData.rut);
  const rutReceptor = cleanRutForAPI(docData.clientRut);

  const dteTypeMap: Record<string, number> = {
    'factura': 33,
    'boleta': 39,
    'guia_despacho': 52,
    'nota_credito': 61
  };

  const tipoDTE = dteTypeMap[docData.type] || 33;

  try {
    const payload = {
      token: SIMPLE_API_KEY,
      reemplazar: true, 
      rutEmisor: rutEmisor,
      ambiente: isSandbox ? 0 : 1, // 0 = Certificación, 1 = Producción
      dte: {
        Encabezado: {
          IdDoc: {
            TipoDTE: tipoDTE,
            FchEmis: new Date().toISOString().split('T')[0],
            IndServicio: 3 
          },
          Emisor: {
            RUTEmisor: rutEmisor,
            RznSoc: emisorData.name,
            Giro: emisorData.giro || "Servicios Industriales",
            DirOrigen: emisorData.address,
            CmnaOrigen: emisorData.comuna || "Santiago", 
          },
          Receptor: {
            RUTRecep: rutReceptor,
            RznSocRecep: docData.clientName,
            GiroRecep: docData.clientGiro || "Giro Cliente", 
            DirRecep: docData.clientAddress || "Dirección Cliente",
            CmnaRecep: docData.clientComuna || "Santiago"
          },
          Totales: {
            MntNeto: Math.round(docData.netAmount),
            TasaIVA: 19,
            IVA: Math.round(docData.taxAmount),
            MntTotal: Math.round(docData.totalAmount)
          }
        },
        Detalle: docData.items.map((it: any, index: number) => ({
          NroLinDet: index + 1,
          NmbItem: it.description,
          QtyItem: it.quantity,
          PrcItem: Math.round(it.unitPrice),
          MntItem: Math.round(it.total)
        }))
      }
    };

    const response = await fetch(SIMPLE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.status === 401) {
      return {
        success: false,
        error: "Fallo de autenticación con SimpleAPI. Revise si su Token es para Producción o Certificación.",
        status: 'error'
      };
    }

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
      return {
        success: false,
        error: result.message || "Rechazo del SII: Verifique si tiene folios disponibles.",
        status: 'error'
      };
    }

  } catch (error: any) {
    return {
      success: false,
      error: "Error de red: No se pudo establecer contacto con el servidor de facturación."
    };
  }
}
