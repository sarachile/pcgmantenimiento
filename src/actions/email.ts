'use server';

import nodemailer from 'nodemailer';

/**
 * @fileOverview Acción de servidor para envío de correos directos vía SMTP.
 * SECURIZADO: Usa variables de entorno para las credenciales en producción.
 */

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendSystemEmail(input: SendEmailInput) {
  // CONFIGURACIÓN DE PRODUCCIÓN:
  // Asegúrate de definir EMAIL_USER y EMAIL_PASS en tu panel de Secrets del hosting.
  const SMTP_USER = process.env.EMAIL_USER || 'control@pcgoperacion.com';
  const SMTP_PASS = process.env.EMAIL_PASS; // NO hardcodear contraseña aquí

  if (!SMTP_PASS) {
    console.error("Error: EMAIL_PASS no definida en variables de entorno.");
    return { success: false, error: "Servidor de correo no configurado (Falta PASS)." };
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

    console.log("Message sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("Error sending email:", error);
    return { success: false, error: "Error en el servidor SMTP. Verifique credenciales." };
  }
}
