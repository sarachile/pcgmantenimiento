'use server';

import { cleanRutForAPI, validateRut } from "@/lib/utils-rut";

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
 */
export async function processElectronicEmission(docData: any, emisorData: any, isSandbox: boolean = true): Promise<EmissionResponse> {
  console.log(`Iniciando emisión ${isSandbox ? 'TEST' : 'PROD'} para:`, docData.clientName);

  if (!SIMPLE_API_KEY) {
    return {
      success: false,
      error: "Error de configuración: SIMPLE_API_KEY no definida en el servidor."
    };
  }

  // VALIDACIÓN DE RUTS ANTES DE ENVIAR
  if (!validateRut(emisorData.rut)) {
    return { success: false, error: "El RUT de tu empresa (emisor) es inválido." };
  }
  if (!validateRut(docData.clientRut)) {
    return { success: false, error: "El RUT del cliente (receptor) es inválido." };
  }

  const rutEmisor = cleanRutForAPI(emisorData.rut);
  const rutReceptor = cleanRutForAPI(docData.clientRut);

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
      rutEmisor: rutEmisor,
      ambiente: isSandbox ? 0 : 1, // 0 = Certificación (Test), 1 = Producción
      dte: {
        Encabezado: {
          IdDoc: {
            TipoDTE: tipoDTE,
            FchEmis: new Date().toISOString().split('T')[0],
            IndServicio: 3 
          },
          Emisor: {
            RUTEmisor: rutEmisor,
            RznSoc: emisorData.name || "Empresa sin nombre",
            Giro: emisorData.giro || "Servicios de Mantenimiento",
            DirOrigen: emisorData.address || "Dirección no especificada",
            CmnaOrigen: emisorData.comuna || "Santiago", 
          },
          Receptor: {
            RUTRecep: rutReceptor,
            RznSocRecep: docData.clientName || "Cliente Genérico",
            GiroRecep: docData.clientGiro || "Giro Cliente", 
            DirRecep: docData.clientAddress && docData.clientAddress !== "S/I" ? docData.clientAddress : "Dirección Cliente",
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
          NmbItem: it.description || "Servicio",
          QtyItem: it.quantity || 1,
          PrcItem: Math.round(it.unitPrice),
          MntItem: Math.round(it.total)
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

    if (response.status === 401) {
      return {
        success: false,
        error: `Autenticación fallida (401). Verifique su API Key para el ambiente ${isSandbox ? 'Certificación' : 'Producción'}.`,
        status: 'error'
      };
    }

    const responseText = await response.text();
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      return {
        success: false,
        error: `Error del servidor de facturación (HTTP ${response.status}).`
      };
    }

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
        error: result.message || "El SII rechazó el documento. Verifique folios disponibles.",
        status: 'error'
      };
    }

  } catch (error: any) {
    console.error("Error crítico en comunicación con SimpleAPI:", error);
    return {
      success: false,
      error: `Error de red: No se pudo contactar al servidor de facturación.`
    };
  }
}
