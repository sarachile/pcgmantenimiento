'use server';

import nodemailer from 'nodemailer';

/**
 * @fileOverview Acción de servidor para envío de correos vía SMTP.
 * Se ha optimizado el remitente para usar exclusivamente el dominio pcgmantenimiento.com
 */

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendSystemEmail(input: SendEmailInput) {
  // Cambiamos el fallback al dominio oficial pcgmantenimiento.com
  const SMTP_USER = process.env.EMAIL_USER || 'control@pcgmantenimiento.com';
  const SMTP_PASS = process.env.EMAIL_PASS; 

  if (!SMTP_PASS) {
    console.error("ERROR DE SEGURIDAD: La variable EMAIL_PASS no está definida.");
    return { 
      success: false, 
      error: "Configuración incompleta: El servidor de correo no está autenticado." 
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
    // Es CRÍTICO que el 'from' coincida exactamente con el SMTP_USER para evitar bloqueos
    const info = await transporter.sendMail({
      from: `"GENKO" <${SMTP_USER}>`,
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
      userFriendlyError = "Error de autenticación: La Contraseña de Aplicación es incorrecta.";
    }

    return { 
      success: false, 
      error: userFriendlyError 
    };
  }
}
