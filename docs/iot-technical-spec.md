# Especificación Técnica: Ecosistema IoT PCGMANTENIMIENTO

Este documento detalla la arquitectura de comunicación entre los dispositivos de campo (medidores) y la plataforma ERP.

## 1. Flujo de Datos
1. **Sensor (End-node)**: Medidor ultrasónico detecta flujo y transmite vía Radio.
2. **Gateway (Antenna)**: Recibe radio y encapsula datos en JSON.
3. **API PCG (Ingestion)**: Recibe el POST, valida `x-api-key` y procesa.
4. **Cloud Firestore**: Almacena el pulso y actualiza el estado del dispositivo.
5. **Dashboard (Real-time)**: El navegador recibe el cambio vía WebSocket y actualiza la UI.

## 2. API de Ingesta
- **URL**: `https://www.pcgmantenimiento.com/api/v1/water-readings`
- **Método**: `POST`
- **Encabezados Requeridos**:
  - `Content-Type: application/json`
  - `x-api-key: [CLAVE_DE_EMPRESA]`

## 3. Formato del Payload (JSON)
```json
{
  "meterId": "SERIAL_DEL_MEDIDOR",
  "value": 125.42,
  "batteryLevel": 95,
  "signalStrength": 80,
  "unitIdentifier": "Depto 402"
}
```

## 4. Lógica de Servidor
- **Aislamiento**: El sistema asocia el `meterId` al `companyId` vinculado a la `x-api-key`.
- **Detección de Fugas**: Valores > 0.8 m³ por pulso disparan automáticamente el estado `hasLeakAlert`.
- **Serie Temporal**: Cada entrada genera un documento único en la subcolección `/readings` con un `serverTimestamp()`.

## 5. Control de Válvulas (Downlink)
El estado de la válvula se gestiona en el campo `status` del documento del medidor (`open` | `closed`). El Gateway debe realizar un `GET` periódico o suscribirse a cambios para accionar el hardware físico.
