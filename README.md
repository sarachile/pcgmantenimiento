# GENKO ERP - Inteligencia Hídrica Industrial

Plataforma de gestión hídrica multisectorial con trazabilidad inalterable e integración IoT.

---

## 🛰️ Guía de Conexión IoT: Del Terreno al CRM
Esta guía explica cómo conectar los medidores inteligentes de agua a la plataforma.

### Paso 1: Instalación Física
1.  **Sentido del Flujo:** Identifique la flecha grabada en el cuerpo del medidor. Debe apuntar hacia la propiedad.
2.  **Posición:** El medidor ultrasónico puede instalarse horizontal o verticalmente.

### Paso 2: Activación y Conexión
*Nuestros medidores usan una red de radio privada o NB-IoT.*
1.  **Despertar el Sensor:** Pase un imán por el costado del equipo o use la App de Instalador (vía NFC) para activarlo.
2.  **Sincronización:** El icono de antena dejará de parpadear cuando la conexión sea exitosa.

---

## 🛠️ Control de Versiones (Git)

Para guardar y desplegar los cambios:

1. **Añadir cambios**: `git add .`
2. **Confirmar**: `git commit -m "Descripción de los cambios"`
3. **Subir**: `git push origin main`

### 🔑 ¿Olvidaste tu contraseña de GitHub?
GitHub ya no acepta contraseñas para comandos de consola. Debes usar un **Personal Access Token (PAT)**:

1.  Entra a **GitHub.com** en tu navegador.
2.  Ve a **Settings** > **Developer Settings** > **Personal Access Tokens** > **Tokens (classic)**.
3.  Presiona **Generate new token**. Dale un nombre y selecciona el permiso `repo`.
4.  **Copia el token** (no lo volverás a ver).
5.  Cuando la terminal te pida "Password", **pega el token** en su lugar.

---

## 📊 Nuevas Funcionalidades
- **Cierre Mensual de Consumo:** Liquidación detallada por departamento con exportación a PDF para cobro de gastos comunes.
- **Auditoría de Autogestión:** Herramienta para que instituciones (ej: Colegio Sagrados Corazones) realicen un levantamiento técnico de su infraestructura.
- **Dashboard de Superadmin:** Monitor de leads y gestión centralizada de administradores de carteras.

---

## 🛠️ Tecnologías
- **NextJS 15** (App Router)
- **Firebase** (Auth, Firestore, Storage)
- **Tailwind CSS + ShadCN UI**
- **Recharts** (Visualización de Telemetría)
