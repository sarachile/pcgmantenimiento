'use server';

import nodemailer from 'nodemailer';

/**
 * @fileOverview Acción de servidor para envío de correos vía SMTP.
 * SEGURIDAD: Utiliza variables de entorno para proteger las credenciales en producción.
 */

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendSystemEmail(input: SendEmailInput) {
  // Las credenciales se obtienen de las variables de entorno definidas en el servidor/hosting
  const SMTP_USER = process.env.EMAIL_USER || 'control@pcgoperacion.com';
  const SMTP_PASS = process.env.EMAIL_PASS; 

  if (!SMTP_PASS) {
    console.error("ERROR DE SEGURIDAD: La variable EMAIL_PASS no está definida en el servidor.");
    return { 
      success: false, 
      error: "Error de configuración: El servidor de correo no está autenticado. Por favor, genere una 'Contraseña de Aplicación' en su cuenta de Google y configúrela como EMAIL_PASS en los Secretos del Hosting." 
    };
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"PCGMANTENIMIENTO ERP" <${SMTP_USER}>`,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });

    console.log("Notificación enviada con éxito: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("Fallo en envío SMTP:", error);
    
    let userFriendlyError = "No se pudo conectar con el servidor de correo.";
    if (error.code === 'EAUTH') {
      userFriendlyError = "Error de autenticación: La Contraseña de Aplicación de Google es incorrecta o ha caducado.";
    }

    return { 
      success: false, 
      error: userFriendlyError 
    };
  }
}
