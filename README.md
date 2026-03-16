# PCGMANTENIMIENTO ERP

Plataforma de gestión industrial con trazabilidad inalterable e integración IoT.

## 🚀 Guía de Configuración DNS para pcgmantenimiento.com

Si tus correos son rechazados por Gmail, debes configurar los siguientes registros en tu proveedor de dominio (donde compraste pcgmantenimiento.com):

### Paso 1: Configurar SPF (Autorizar envío)
Agrega un registro de tipo **TXT** en el host raíz (`@`):
- **Valor:** `v=spf1 include:_spf.google.com ~all`

### Paso 2: Configurar DMARC (Protección)
Agrega un registro de tipo **TXT** en el host `_dmarc`:
- **Valor:** `v=DMARC1; p=none;`

---

## 🛠️ Resolución de Error 400 en App Hosting

Si tras pagar la cuenta sigues viendo un error **400 Bad Request** al lanzar:

1. **Borrar Backend**: Ve a la pestaña "Configuración" del Backend en Firebase y haz clic en **"Borrar Backend"** (abajo).
2. **Crear Nuevo**: Dale a "Nuevo en App Hosting", conecta tu GitHub y selecciona la rama `main`.
3. **Configurar Secretos**: ¡IMPORTANTE! Al recrear el backend, debes volver a añadir tus llaves privadas:
   - Ve a la pestaña **Configuración** del nuevo Backend.
   - En la sección **Secretos**, añade:
     - `EMAIL_PASS`: Tu contraseña de aplicación de Gmail.
     - `SIMPLE_API_KEY`: Tu llave de SimpleAPI para facturación.
4. **Lanzar**: Ahora realiza el lanzamiento y Google Cloud usará los nuevos permisos activos.

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
