// src/notification/notification.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { EventType } from './entities/event-type.entity';
import { UserNotificationSetting } from './entities/user-notification-setting.entity';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventType, UserNotificationSetting]),
    MailModule,
  ],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}