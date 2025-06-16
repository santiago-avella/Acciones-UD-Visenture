// src/mail/mail.service.ts
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger, RequestTimeoutException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly configService: ConfigService
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access

    this.transporter = nodemailer.createTransport({
      service: configService.get('MAIL_SERVICE'),
      auth: {
        user: this.configService.get('MAIL_ADDRESS'),
        pass: this.configService.get('MAIL_PASS'), // Contraseña de aplicación de Gmail
      },
    });
  }

  async sendMail(options: MailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"Acciones UD" <${this.configService.get('MAIL_ADDRESS')}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      this.logger.log(`Email sent to: ${options.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw error;
    }
  }

  async sendLoginToken(email: string, token: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    try {
      await this.transporter.sendMail({
        to: email,
        subject: 'Tu código de acceso',
        text: `Tu token de acceso es: ${token}`,
      });
    } catch (error) {
      throw new RequestTimeoutException('Error en el envio de token', { description: `No ha sido existosos el envio del token, revise las credenciales.  ${error}` })
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetLink = `http://localhost:4200/reset-password?token=${token}&email=${email}`;

    await this.sendMail({
      to: email,
      subject: 'Restablecimiento de contraseña',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #2563eb;">Restablecer contraseña</h2>
          <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
          <a href="${resetLink}" style="...">Restablecer contraseña</a>
          <p>El enlace expirará en 1 hora.</p>
        </div>
      `,
    });
  }

  async sendAdvisorAssignedNotification(advisorEmail: string, advisorName: string, clientName: string): Promise<void> {
   await this.sendMail({
    to: advisorEmail,
    subject: 'Nuevo inversor asignado',
    html : `
    <div style="
      font-family: 'Arial', sans-serif;
      max-width: 600px;
      margin: 0 auto;
      background-color: #f8f9fa;
      border-radius: 8px;
      overflow: hidden;
    ">
      <!-- Encabezado -->
      <div style="
        background-color: #0f172b;
        padding: 20px;
        text-align: center;
      ">
        <h1 style="
          color: #ffffff;
          margin: 0;
          font-size: 24px;
        ">
          <strong>Soporte</strong> Acciones UD
        </h1>
      </div>

      <!-- Contenido -->
      <div style="
        padding: 30px;
        background-color: #ffffff;
      ">
        <p style="
          color: #6c757d;
          font-size: 14px;
          margin-bottom: 20px;
        ">
          Fecha: ${new Date().toLocaleString('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </p>

        <h2 style="
          color: #0f172b;
          margin-top: 0;
          font-size: 20px;
        ">
          Nuevo inversor asignado
        </h2>

        <p style="
          color: #212529;
          line-height: 1.6;
        ">
          Hola <strong>${advisorName}</strong>,
        </p>

        <p style="
          color: #212529;
          line-height: 1.6;
        ">
          Se te ha asignado un nuevo inversor: 
          <strong style="color: #00d492">${clientName}</strong>.
        </p>

        <div style="
          margin-top: 30px;
          padding: 15px;
          background-color: #f1f8ff;
          border-left: 4px solid #00d492;
          border-radius: 4px;
        ">
          <p style="
            margin: 0;
            color: #0f172b;
            font-size: 14px;
          ">
            Puedes acceder a la plataforma para ver los detalles completos del portafolio asignado.
          </p>
        </div>
      </div>

      <!-- Pie de página -->
      <div style="
        background-color: #081023;
        padding: 15px;
        text-align: center;
        color: #ffffff;
        font-size: 12px;
      ">
        <p style="margin: 0;">
          Saludos,<br>
          <strong>Equipo de Acciones UD</strong>
        </p>
        <p style="margin: 5px 0 0 0; color: rgba(255,255,255,0.7);">
          accionesudinc@gmail.com
        </p>
      </div>
    </div>
  `,
   });
  }
}