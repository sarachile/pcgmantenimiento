# PCGMANTENIMIENTO ERP

Plataforma de gestión industrial con trazabilidad inalterable e integración IoT.

## 🚀 Guía de Configuración DNS (Squarespace / Firebase)

Para que tu dominio `pcgmantenimiento.com` funcione correctamente, debes seguir este orden exacto:

### Paso 1: Configuración en Firebase Console
1. Ve a la **Consola de Firebase** > **App Hosting**.
2. Selecciona tu backend y ve a la pestaña **Settings** (Configuración) > **Domains**.
3. Haz clic en **"Connect Domain"** y agrega `pcgmantenimiento.com`.
4. Firebase te entregará los valores para los registros **A**, **TXT (fah-claim)** y **CNAME (_acme-challenge)**.

### Paso 2: Configuración en Squarespace (Custom Records)
Agrega estos registros en la sección **"Custom Records"** de Squarespace usando los valores que te dio Firebase:

| Tipo | Host | Datos / Valor | Nota |
| :--- | :--- | :--- | :--- |
| **A** | `@` | `35.219.200.7` | Apunta el dominio raíz a Google. |
| **CNAME** | `www` | `@` | Hace que www.pcgmantenimiento.com use la misma IP. |
| **TXT** | `@` | (Código `fah-claim`) | Valida que eres el dueño del dominio. |
| **CNAME** | `_acme-challenge` | (Código SSL de Firebase) | **CLAVE:** Valida el certificado para el dominio SIN www. |
| **CNAME** | `_acme-challenge.www` | (Código SSL de Firebase) | Valida el certificado para el dominio CON www. |

### Paso 3: Configuración de Correo (Google Workspace)
Para recibir y enviar correos sin bloqueos, agrega estos registros:

#### A. Registro MX (Para RECIBIR)
- **Host**: `@`
- **Tipo**: `MX`
- **Prioridad**: `1`
- **Data**: `ASPMX.L.GOOGLE.COM`

#### B. Registro SPF (Para ENVIAR)
- **Host**: `@`
- **Tipo**: `TXT`
- **Data**: `v=spf1 include:_spf.google.com ~all`

#### C. Registro DMARC (Seguridad)
- **Host**: `_dmarc`
- **Tipo**: `TXT`
- **Data**: `v=DMARC1; p=none;`

## 🛠️ Tecnologías
- **NextJS 15** (App Router)
- **Firebase** (Auth, Firestore, Storage)
- **Genkit** (IA para resúmenes técnicos)
- **Tailwind CSS + ShadCN UI**
