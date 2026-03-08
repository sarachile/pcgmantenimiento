# PCGMANTENIMIENTO ERP

Plataforma de gestión industrial con trazabilidad inalterable e integración IoT.

## 🚀 Guía de Configuración DNS (Squarespace / Firebase)

Si has configurado tu dominio `pcgmantenimiento.com` en Firebase App Hosting, sigue estas instrucciones para asegurar que tanto la versión con **www** como la versión **raíz (sin www)** funcionen, y que el correo no sea bloqueado.

### 1. Conectividad Web (Firebase App Hosting)
Agrega estos registros en la sección **"Custom Records"** de Squarespace:

| Tipo | Host | Datos / Valor | Nota |
| :--- | :--- | :--- | :--- |
| **A** | `@` | `35.219.200.7` | Apunta el dominio raíz a Google. |
| **CNAME** | `www` | `@` | Hace que www.pcgmantenimiento.com use la misma IP. |
| **TXT** | `@` | (El código `fah-claim` de Firebase) | Valida que eres el dueño del dominio. |
| **CNAME** | `_acme-challenge.www` | (Código SSL de Firebase) | Valida el certificado de seguridad para www. |
| **CNAME** | `_acme-challenge` | (Código SSL de Firebase) | **NUEVO:** Valida el certificado para el dominio sin www. |

### 2. Configuración de Correo (Google Workspace)
Para que el correo funcione y no sea detectado como SPAM, agrega estos registros:

#### A. Registro SPF (Para ENVIAR)
- **Host**: `@`
- **Tipo**: `TXT`
- **Data**: `v=spf1 include:_spf.google.com ~all`

#### B. Registro DMARC (Seguridad)
- **Host**: `_dmarc`
- **Tipo**: `TXT`
- **Data**: `v=DMARC1; p=none;`

#### C. Registros MX (Para RECIBIR)
Debes agregar el servidor de Google para que te lleguen los correos:
- **Host**: `@`
- **Tipo**: `MX`
- **Prioridad**: `1`
- **Data**: `ASPMX.L.GOOGLE.COM`

#### D. Registro DKIM (Firma digital)
- Genera este código en tu consola de Google Admin (Gmail -> Autenticar correo).
- **Host**: `google._domainkey`
- **Tipo**: `TXT`
- **Data**: (El código muy largo que genera Google)

## 🛠️ Tecnologías
- **NextJS 15** (App Router)
- **Firebase** (Auth, Firestore, Storage)
- **Genkit** (IA para resúmenes técnicos)
- **Tailwind CSS + ShadCN UI**
