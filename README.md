# PCGMANTENIMIENTO ERP

Plataforma de gestión industrial con trazabilidad inalterable e integración IoT.

## 🚀 Guía de Configuración DNS (Squarespace / Firebase)

Para que tu dominio `pcgmantenimiento.com` funcione correctamente, debes seguir este orden exacto.

### ⚠️ REGLA DE ORO EN SQUARESPACE
**NUNCA** escribas `pcgmantenimiento.com` en el campo **HOST**. Squarespace lo añade automáticamente. 
- Si escribes `pcgmantenimiento.com` en el host, internet verá `pcgmantenimiento.com.pcgmantenimiento.com` y **FALLARÁ**.
- Usa siempre `@` para referirte al dominio principal.

### Paso 1: Configuración en Firebase Console
1. Ve a la **Consola de Firebase** > **App Hosting**.
2. Selecciona tu backend y ve a la pestaña **Settings** (Configuración) > **Domains**.
3. Haz clic en **"Connect Domain"** y agrega `pcgmantenimiento.com`.
4. Firebase te entregará los valores para los registros **A**, **TXT (fah-claim)** y **CNAME (_acme-challenge)**.

### Paso 2: Configuración en Squarespace (Custom Records)
Agrega estos registros en la sección **"Custom Records"** de Squarespace. **Copia exactamente el campo Host**:

| Tipo | Host | Datos / Valor | Nota |
| :--- | :--- | :--- | :--- |
| **A** | `@` | `35.219.200.7` | Apunta el dominio raíz a Google. |
| **CNAME** | `www` | `@` | Hace que www use la misma configuración. |
| **TXT** | `@` | (Código `fah-claim`) | Valida que eres el dueño del dominio. |
| **CNAME** | `_acme-challenge` | (Valor de Firebase) | Valida SSL para el dominio raíz. |
| **CNAME** | `_acme-challenge.www` | (Valor de Firebase) | Valida SSL para la versión con www. |

### Paso 3: Configuración de Correo (Google Workspace)
Para recibir y enviar correos, agrega estos registros en la sección **"Custom Records"**:

| Tipo | Host | Datos / Valor | Prioridad |
| :--- | :--- | :--- | :--- |
| **MX** | `@` | `ASPMX.L.GOOGLE.COM` | `1` |
| **TXT** | `@` | `v=spf1 include:_spf.google.com ~all` | N/A |
| **TXT** | `_dmarc` | `v=DMARC1; p=none;` | N/A |

### 🔍 Cómo verificar el estado

1.  **DNS Checker (Externo)**: Entra en [dnschecker.org](https://dnschecker.org).
    - Ingresa `pcgmantenimiento.com`.
    - Selecciona tipo **A**. Deberías ver la IP `35.219.200.7` con checks verdes.
2.  **Consola de Firebase**: Verás el estado como **"Active"** en verde cuando la propagación termine.
3.  **Prueba de Navegador**: Entra a `https://pcgmantenimiento.com`. Si ves el candado, está listo.

### 🛠️ Solución de Problemas (FAQ)

**¿Por qué DNSChecker muestra todo con XXX?**
- Revisa si escribiste el nombre del dominio en el campo HOST. Si ves algo como `pcgmantenimiento.com` en la columna Host de Squarespace, bórralo y pon `@`.

**¿Por qué Firebase me pide borrar registros que no veo?**
- **Presets ocultos:** Squarespace a veces mantiene registros internos. Si ves un bloque llamado "Email Security", bórralo con el basurero rojo antes de agregar los tuyos.

**¿Cuánto tarda el certificado SSL (Candado)?**
- Una vez que los registros DNS están en verde, el certificado puede tardar de **1 a 24 horas**. No te desesperes, es automático.

## 🛠️ Tecnologías
- **NextJS 15** (App Router)
- **Firebase** (Auth, Firestore, Storage)
- **Genkit** (IA para resúmenes técnicos)
- **Tailwind CSS + ShadCN UI**
