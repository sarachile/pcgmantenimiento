# PCGMANTENIMIENTO ERP

Plataforma de gestión industrial con trazabilidad inalterable e integración IoT.

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
2. **Confirmar**: `git commit -m "Descripción de tus mejoras"`
3. **Subir a GitHub**: `git push origin main`

---

## 🛠️ Resolución de Error 400 y Recuperación tras Pago

Si tras pagar la cuenta sigues viendo errores o los commits no llegan, sigue este proceso de "Borrado y Reconstrucción":

1. **Borrar Backend**: Ve a la pestaña "Configuración" del Backend en Firebase y haz clic en **"Borrar Backend"** (botón rojo abajo).
2. **Crear Nuevo**: Dale a "Nuevo en App Hosting", conecta tu GitHub y selecciona la rama `main`.
3. **Configurar Secretos**: ¡IMPORTANTE! Al recrear el backend, debes volver a añadir tus llaves privadas en la pestaña **Configuración > Secretos**:
   - `EMAIL_PASS`: Tu contraseña de aplicación de Gmail.
   - `SIMPLE_API_KEY`: Tu llave de SimpleAPI para facturación.
4. **Reasociar Dominios**: Ve a la pestaña **"Dominios"** del nuevo Backend y añade `pcgmantenimiento.com`. Como ya tienes los DNS configurados, la validación será casi instantánea.
5. **Lanzar**: Realiza el lanzamiento manual con el ID de confirmación de GitHub.

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
