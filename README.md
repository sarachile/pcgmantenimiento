# PCGMANTENIMIENTO ERP

Plataforma de gestión industrial con trazabilidad inalterable e integración IoT.

## 🚀 Guía de Configuración DNS (Squarespace / Firebase)

Si has configurado tu dominio `pcgmantenimiento.com` en Firebase App Hosting, sigue estas instrucciones para asegurar que la web y el correo funcionen correctamente.

### 1. Conectividad Web (Firebase App Hosting)
Asegúrate de tener los registros que Firebase te entregó:
- **A Record**: Apuntando a la IP de Google (ej: `35.219.200.7`).
- **TXT (fah-claim)**: Para validar que eres el dueño del dominio.
- **CNAME (_acme-challenge)**: Para generar el certificado SSL automático.

### 2. Configuración de Correo (Google Workspace)
Si ya borraste el preset "Email Security", debes tener estos registros en la sección **"Custom Records"**:

#### A. Registros TXT (Seguridad)
1. **Registro SPF**:
   - **Host**: `@`
   - **Data**: `v=spf1 include:_spf.google.com ~all`
2. **Registro DMARC**:
   - **Host**: `_dmarc`
   - **Data**: `v=DMARC1; p=none;`
3. **Registro DKIM (Crucial para no caer en SPAM)**:
   - Debes generarlo en tu consola de Google Admin (Gmail -> Autenticar correo).
   - Generará un registro TXT con un host como `google._domainkey`.

#### B. Registros MX (Para RECIBIR correos)
Si usas Google Workspace, debes agregar este registro MX (o los 5 que pide Google):
- **Host**: `@`
- **Tipo**: `MX`
- **Prioridad**: `1`
- **Data**: `ASPMX.L.GOOGLE.COM`

## 🛠️ Tecnologías
- **NextJS 15** (App Router)
- **Firebase** (Auth, Firestore, Storage)
- **Genkit** (IA para resúmenes técnicos)
- **Tailwind CSS + ShadCN UI**
