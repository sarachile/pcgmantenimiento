
'use server';

import nodemailer from 'nodemailer';

/**
 * @fileOverview Acción de servidor para envío de correos directos vía SMTP.
 * Evita depender de extensiones de Firebase que fallen en el despliegue de Cloud Functions.
 */

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendSystemEmail(input: SendEmailInput) {
  // Configuración SMTP directa usando tus credenciales de Gmail (App Password)
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: 'control@pcgoperacion.com',
      pass: 'cqyqwlmbblxlkbla', // Tu contraseña de aplicación
    },
  });

  try {
    const info = await transporter.sendMail({
      from: '"PCGMANTENIMIENTO ERP" <control@pcgoperacion.com>',
      to: input.to,
      subject: input.subject,
      html: input.html,
    });

    console.log("Message sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message || "Error desconocido en el servidor SMTP." };
  }
}
