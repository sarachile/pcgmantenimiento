import { NextResponse } from 'next/server';

/**
 * @fileOverview Endpoint de verificación de salud para la API Pública.
 * Este es el primer paso para permitir integraciones externas.
 */

export async function GET() {
  return NextResponse.json({
    status: 'operational',
    version: '1.0.0',
    service: 'PCGMANTENIMIENTO Public API',
    timestamp: new Date().toISOString(),
    documentation: 'https://docs.pcgmantenimiento.com' // Placeholder
  });
}
