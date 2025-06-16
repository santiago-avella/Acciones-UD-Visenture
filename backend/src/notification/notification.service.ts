// src/notification/notification.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventType } from './entities/event-type.entity';
import { NOTIFICATION_EVENTS } from './event-types.constants';
import { MailService } from 'src/mail/mail.service';
import { User } from 'src/users/users.entity';
import { UserNotificationSetting } from './entities/user-notification-setting.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(EventType)
    private readonly eventTypeRepo: Repository<EventType>,

    @InjectRepository(UserNotificationSetting)
    private readonly userSettingRepo: Repository<UserNotificationSetting>,

    private readonly mailService: MailService,
  ) { }

  // Inicializar tipos de evento si no existen
  async seedEventTypes() {
    const initialEvents = EventType.getInitialEvents();

    for (const event of initialEvents) {
      const exists = await this.eventTypeRepo.findOne({ where: { code: event.code } });
      if (!exists) {
        await this.eventTypeRepo.save(this.eventTypeRepo.create(event));
        this.logger.log(`Event type created: ${event.code}`);
      }
    }
  }

  // Obtener el tipo de evento por código
  async getEventTypeByCode(code: string): Promise<EventType> {
    const eventType = await this.eventTypeRepo.findOne({ where: { code } });
    if (!eventType) {
      throw new Error(`EventType with code '${code}' not found`);
    }
    return eventType;
  }

  // Enviar notificación de asignación de inversor
  async sendAdvisorAssignedNotification(
    advisor: User,
    client: User
  ): Promise<void> {
    try {

      if (!advisor.account?.email) {
        this.logger.warn(`No se puede enviar notificación: comisionista ${advisor.identity_document} no tiene email configurado`);
        return;
      }
      const eventType = await this.getEventTypeByCode(NOTIFICATION_EVENTS.ADVISOR_ASSIGNED);

      // Verificar si el comisionista tiene habilitadas las notificaciones por email
      const settings = await this.userSettingRepo.findOne({
        where: {
          idAccount: advisor.identity_document,
          idEventType: eventType.id
        }
      });

      // Si no tiene configuración, creamos una por defecto
      if (!settings) {
        const newSettings = this.userSettingRepo.create({
          idAccount: advisor.identity_document,
          idEventType: eventType.id,
          notifyEmail: true,
          notifySms: false,
          notifyWhatsapp: false,
        });
        await this.userSettingRepo.save(newSettings);
      }

      // Solo enviamos si tiene habilitado el email
      if (settings?.notifyEmail ?? true) {
        await this.mailService.sendAdvisorAssignedNotification(advisor.account.email, (advisor.first_name + " " + advisor.last_name), (client.first_name + " " + client.last_name));

        this.logger.log(`Notificación enviada al comisionista: ${advisor.identity_document}`);
      }
    } catch (error) {
      this.logger.error(`Error enviando notificación: ${error.message}`, error.stack);
    }
  }
}