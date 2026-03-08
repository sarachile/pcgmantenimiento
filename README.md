# PCGMANTENIMIENTO ERP

Plataforma de gestión industrial con trazabilidad inalterable e integración IoT.

## 🚀 Guía de Configuración DNS (Squarespace / Firebase)

Si has configurado tu dominio `pcgmantenimiento.com` en Firebase App Hosting, sigue estas instrucciones para asegurar que la web y el correo funcionen correctamente.

### 1. Conectividad Web (Firebase App Hosting)
Asegúrate de tener los registros que Firebase te entregó:
- **A Record**: Apuntando a la IP de Google (ej: `35.219.200.7`).
- **TXT (fah-claim)**: Para validar que eres el dueño del dominio.
- **CNAME (_acme-challenge)**: Para generar el certificado SSL automático.

### 2. Desbloqueo de Correo Electrónico (Muy Importante)
Si tus correos rebotan o llegan a Spam, ajusta estos registros TXT en Squarespace:

#### A. Registro SPF (TXT)
- **Error común**: `v=spf1 -all` (Bloquea todos los envíos).
- **Solución (Si usas Google)**: `v=spf1 include:_spf.google.com ~all`
- **Explicación**: El `~all` permite que los correos pasen aunque la validación no sea perfecta, evitando bloqueos agresivos.

#### B. Registro DMARC (TXT)
- **Error común**: `p=reject` (Borra cualquier correo sospechoso).
- **Solución**: `v=DMARC1; p=none;`
- **Explicación**: El modo `p=none` permite que los correos se entreguen mientras terminas de configurar tu seguridad DKIM.

#### C. Registro DKIM (TXT)
- Debes generar la llave desde tu proveedor de correo (Google Workspace) y pegarla en Squarespace. Sin esto, el registro DMARC no podrá validar tus correos como auténticos.

## 🛠️ Tecnologías
- **NextJS 15** (App Router)
- **Firebase** (Auth, Firestore, Storage)
- **Genkit** (IA para resúmenes técnicos)
- **Tailwind CSS + ShadCN UI**
