# PCGMANTENIMIENTO ERP

Plataforma de gestión industrial con trazabilidad inalterable e integración IoT.

## 🚀 Guía de Configuración DNS (Squarespace / Firebase)

Si has configurado tu dominio `pcgmantenimiento.com` en Firebase App Hosting, sigue estas instrucciones para asegurar que la web y el correo funcionen correctamente.

### 1. Conectividad Web (Firebase App Hosting)
Asegúrate de tener los registros que Firebase te entregó en la sección de **"Custom Records"** de Squarespace:
- **A Record**: 
  - Host: `@` 
  - Data: `35.219.200.7`
- **TXT (fah-claim)**: 
  - Host: `@` 
  - Data: (El código largo que te dio Firebase)
- **CNAME (_acme-challenge)**: 
  - Host: `_acme-challenge.www` 
  - Data: (El código de validación SSL de Firebase)

### 2. Configuración de Correo (Google Workspace)
Para que el correo funcione y no sea detectado como SPAM, agrega estos registros en la sección **"Custom Records"**:

#### A. Registro SPF (Para ENVIAR correos)
Este registro autoriza a Google a enviar correos en tu nombre.
- **Host**: `@`
- **Tipo**: `TXT`
- **Data**: `v=spf1 include:_spf.google.com ~all`

#### B. Registro DMARC (Seguridad de entrega)
- **Host**: `_dmarc`
- **Tipo**: `TXT`
- **Data**: `v=DMARC1; p=none;`

#### C. Registro DKIM (Firma digital)
- Genera este código en tu consola de Google Admin (Gmail -> Autenticar correo).
- **Host**: `google._domainkey`
- **Tipo**: `TXT`
- **Data**: (El código muy largo que genera Google)

#### D. Registros MX (Para RECIBIR correos)
Sin estos registros, nadie podrá escribirte. Debes agregar el principal (Prioridad 1):
- **Host**: `@`
- **Tipo**: `MX`
- **Prioridad**: `1`
- **Data**: `ASPMX.L.GOOGLE.COM`

*Nota: Google suele pedir 4 registros MX adicionales con prioridades 5 y 10 para mayor respaldo.*

## 🛠️ Tecnologías
- **NextJS 15** (App Router)
- **Firebase** (Auth, Firestore, Storage)
- **Genkit** (IA para resúmenes técnicos)
- **Tailwind CSS + ShadCN UI**
