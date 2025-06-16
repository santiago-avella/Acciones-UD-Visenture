// src/notification/entities/user-notification-setting.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { EventType } from './event-type.entity';
import { User } from 'src/users/users.entity';

@Entity()
export class UserNotificationSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_account' })
  idAccount: string; // identity_document del usuario

  @Column({ name: 'id_event_type' })
  idEventType: number; // ID del tipo de evento

  @Column({ name: 'notify_email', default: true })
  notifyEmail: boolean;

  @Column({ name: 'notify_sms', default: false })
  notifySms: boolean;

  @Column({ name: 'notify_whatsapp', default: false })
  notifyWhatsapp: boolean;

  @Column({ name: 'last_change_time', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastChangeTime: Date;

  // Relación con EventType
  @ManyToOne(() => EventType)
  @JoinColumn({ name: 'id_event_type' })
  eventType: EventType;

  // Relación con User (opcional, si necesitas acceder a los datos completos)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'id_account', referencedColumnName: 'identity_document' })
  user: User;
}