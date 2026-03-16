# PCGMANTENIMIENTO ERP

Plataforma de gestión industrial con trazabilidad inalterable e integración IoT.

## 🚀 Guía de Configuración DNS para pcgmantenimiento.com

Si tus correos son rechazados por Gmail con el error **550 5.7.26 (Unauthenticated sender)**, debes configurar los siguientes registros en tu proveedor de dominio (Squarespace, Godaddy, etc.) para el dominio `pcgmantenimiento.com`.

### Paso 1: Configurar SPF (Autorizar envío)
Agrega un registro de tipo **TXT** en el host raíz (`@`):
- **Tipo:** `TXT`
- **Host:** `@`
- **Valor:** `v=spf1 include:_spf.google.com ~all`
*Nota: Esto autoriza a Google a enviar correos en nombre de pcgmantenimiento.com.*

### Paso 2: Configurar DMARC (Protección de Marca)
Agrega un registro de tipo **TXT** en el host `_dmarc`:
- **Tipo:** `TXT`
- **Host:** `_dmarc`
- **Valor:** `v=DMARC1; p=none;`
*Nota: Esto es obligatorio para que Gmail y Yahoo acepten tus correos.*

### Paso 3: Configurar DKIM (Firma Digital)
1. Ve al panel de **Google Workspace Admin** > Aplicaciones > Gmail > Autenticar correo electrónico.
2. Genera un nuevo registro DKIM para `pcgmantenimiento.com`.
3. Copia el valor generado y pégalo como un registro **TXT** en tu DNS con el host `google._domainkey`.

---

## 🛠️ Configuración de App Hosting (Firebase)

Para que tu dominio principal funcione correctamente:

### Regla de Oro en Squarespace
**NUNCA** escribas el dominio completo en el campo **HOST**. Usa siempre `@` para el dominio raíz.

| Tipo | Host | Datos / Valor | Nota |
| :--- | :--- | :--- | :--- |
| **A** | `@` | `35.219.200.7` | Apunta el dominio raíz a Google. |
| **CNAME** | `www` | `@` | Hace que www use la misma configuración. |
| **TXT** | `@` | (Código `fah-claim`) | Valida propiedad en Firebase. |

## 🛠️ Tecnologías
- **NextJS 15** (App Router)
- **Firebase** (Auth, Firestore, Storage)
- **Genkit** (IA para resúmenes técnicos)
- **Tailwind CSS + ShadCN UI**
