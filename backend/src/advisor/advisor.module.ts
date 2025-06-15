// src/advisor/advisor.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdvisorService } from './advisor.service';
import { AdvisorController } from './advisor.controller';
import { AdvisorClient } from './entities/advisor-client.entity';
import { User } from 'src/users/users.entity';
import { Role } from 'src/roles-permission/entities/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AdvisorClient, User, Role])],
  controllers: [AdvisorController],
  providers: [AdvisorService],
  exports: [AdvisorService],
})
export class AdvisorModule {}