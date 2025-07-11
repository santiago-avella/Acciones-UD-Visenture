import { forwardRef, Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/users.entity';
import { Account } from './entities/account.entity';
import { AccountsService } from './services/accounts.service';
import { AuthModule } from 'src/auth/auth.module';
import { Role } from 'src/roles-permission/entities/role.entity';
import { AlpacaBrokerModule } from 'src/alpaca_broker/alpaca_broker.module';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { OrdersModule } from 'src/orders/orders.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { PreferencesModule } from 'src/preferences/preferences.module';
@Module({
  controllers: [AccountsController],
  providers: [AccountsService],
  imports: [forwardRef(() => OrdersModule), TransactionsModule, 
    AuthModule,
    TypeOrmModule.forFeature([User, Account, Role]),
    forwardRef(() => AlpacaBrokerModule),
    NotificationsModule,
    forwardRef(() => PreferencesModule),
  ],
  exports: [AccountsService],
})
export class AccountsModule {}
