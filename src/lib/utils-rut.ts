/**
 * @fileOverview Utilidades para la validación y formateo de RUT chileno.
 */

/**
 * Valida que un RUT sea matemáticamente correcto según el algoritmo de Módulo 11.
 */
export function validateRut(rut: string): boolean {
  if (!rut || typeof rut !== 'string') return false;
  
  // Limpiar puntos y guión
  const cleanRut = rut.replace(/\./g, '').replace(/-/g, '').trim().toUpperCase();
  
  if (cleanRut.length < 2) return false;
  
  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);
  
  if (!/^\d+$/.test(body)) return false;
  
  let sum = 0;
  let multiplier = 2;
  
  for (let i = body.length - 1; i >= 0; i--) {
    sum += multiplier * parseInt(body[i]);
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const expectedDv = 11 - (sum % 11);
  const dvStr = expectedDv === 11 ? '0' : expectedDv === 10 ? 'K' : expectedDv.toString();
  
  return dvStr === dv;
}

/**
 * Formatea un string de RUT a formato 12.345.678-9
 */
export function formatRut(rut: string): string {
  const clean = rut.replace(/\./g, '').replace(/-/g, '').trim().toUpperCase();
  if (clean.length < 2) return clean;
  
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  
  let formatted = '';
  for (let i = body.length - 1, j = 1; i >= 0; i--, j++) {
    formatted = body[i] + formatted;
    if (j % 3 === 0 && i !== 0) formatted = '.' + formatted;
  }
  
  return `${formatted}-${dv}`;
}

/**
 * Limpia el RUT para envío a API (solo números y K, sin puntos ni guión)
 */
export function cleanRutForAPI(rut: string): string {
  return rut.replace(/\./g, '').replace(/-/g, '').trim().toUpperCase();
}
