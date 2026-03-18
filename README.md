# PCGMANTENIMIENTO ERP

Plataforma de gestión industrial con trazabilidad inalterable e integración IoT.

---

## 🛰️ Guía de Conexión IoT: Del Terreno al CRM
Esta guía explica cómo conectar los medidores inteligentes de agua a la plataforma, desde la instalación física hasta el monitoreo en tiempo real.

### Paso 1: Instalación Física (Plomería)
1.  **Sentido del Flujo:** Identifique la flecha grabada en el cuerpo del medidor. Debe apuntar hacia la propiedad (sentido del agua).
2.  **Posición:** El medidor ultrasónico puede instalarse horizontal o verticalmente. Asegúrese de que el visor digital quede hacia arriba o al frente para facilitar lecturas manuales de respaldo.
3.  **Limpieza:** Antes de conectar, deje correr el agua por 30 segundos para limpiar sedimentos que puedan obstruir los filtros internos.

### Paso 2: Activación y Conexión de Radio (Medidor ➜ Antena)
*Nuestros medidores no usan Wi-Fi de los vecinos, usan una red de radio privada PCG.*
1.  **Despertar el Sensor:** Los medidores vienen en "Modo Almacén" para ahorrar batería. Pase un imán por el costado del equipo o use la App de Instalador (vía NFC) para activarlo.
2.  **Sincronización:** Una vez activo, el medidor buscará automáticamente la **Antena Maestra (Gateway)** más cercana.
3.  **Verificación:** El icono de antena en el visor del medidor dejará de parpadear y se quedará fijo cuando la conexión sea exitosa.

### Paso 3: Configuración de la Antena Maestra (Antena ➜ Internet)
1.  **Ubicación:** Instale la antena en un punto alto (conserjería, azotea o sala técnica) para maximizar la cobertura.
2.  **Energía:** Conecte a una fuente de poder ininterrumpida (UPS) para que el monitoreo no se detenga durante cortes de luz.
3.  **Conectividad:** La antena debe estar conectada al router del edificio vía cable Ethernet o tener un chip 4G/LTE de datos activo.

### Paso 4: Acople con el CRM (Antena ➜ API PCGMANTENIMIENTO)
1.  **Obtener Llave API:** En el ERP, vaya a **"Mi Empresa"** y presione **"Generar API Key"**. Copie este código.
2.  **Configurar Destino:** En la configuración de su Antena Maestra (Panel de Control de Hardware), pegue la API Key y configure la dirección de envío:
    `https://www.pcgmantenimiento.com/api/v1/water-readings`
3.  **Formato de Datos (JSON):** La antena debe enviar un POST con el encabezado `x-api-key` y el siguiente cuerpo:
    ```json
    {
      "meterId": "SERIAL_DEL_MEDIDOR",
      "value": 125.42,
      "batteryLevel": 95,
      "signalStrength": 80,
      "unitIdentifier": "Depto 402"
    }
    ```
4.  **Mapeo de Unidades:** El ID que aparece en la etiqueta del medidor (ej: 874455) debe coincidir con el `meterId` enviado. El sistema enrolará automáticamente la unidad en el primer pulso.

---

## 🚀 Guía de Configuración DNS para pcgmantenimiento.com

Si tus correos son rechazados por Gmail, debes configurar los siguientes registros en tu proveedor de dominio:

### Paso 1: Configurar SPF (Autorizar envío)
Agrega un registro de tipo **TXT** en el host raíz (`@`):
- **Valor:** `v=spf1 include:_spf.google.com ~all`

### Paso 2: Configurar DMARC (Protección)
Agrega un registro de tipo **TXT** en el host `_dmarc`:
- **Valor:** `v=DMARC1; p=none;`

---

## 🛠️ Control de Versiones (Git)

Para guardar tus avances y desplegar los cambios en producción, usa estos comandos:

1. **Añadir cambios**: `git add .`
2. **Confirmar**: `git commit -m "Activación de Endpoint de Ingesta IoT y Trazabilidad Hídrica"`
3. **Subir a GitHub**: `git push origin main`

---

## 💳 Verificación de Google Cloud
Asegúrate de que estas APIs estén "Habilitadas" en [console.cloud.google.com](https://console.cloud.google.com):
- **Cloud Build API**
- **Cloud Run Admin API**
- **Secret Manager API**

## 🛠️ Tecnologías
- **NextJS 15** (App Router)
- **Firebase** (Auth, Firestore, Storage)
- **Genkit** (IA para resúmenes técnicos)
- **Tailwind CSS + ShadCN UI**
