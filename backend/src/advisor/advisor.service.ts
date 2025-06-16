// src/advisor/advisor.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdvisorClient } from './entities/advisor-client.entity';
import { User } from 'src/users/users.entity';
import { Role } from 'src/roles-permission/entities/role.entity';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class AdvisorService {
  constructor(
    @InjectRepository(AdvisorClient)
    private readonly advisorClientRepo: Repository<AdvisorClient>,
    
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    private readonly notificationService: NotificationService
  ) {
     this.notificationService.seedEventTypes().catch(error => {
      console.error('Error seeding event types:', error);
    });
  }

  async getCertifiedAdvisors(): Promise<User[]> {
    const comisionistaRole = await this.roleRepo.findOne({ 
      where: { name: 'comisionista' },
      relations: ['users']
    });

    if (!comisionistaRole) return [];

    return comisionistaRole.users.map(user => ({
      identity_document: user.identity_document,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone
    })) as User[];
  }

  async assignAdvisor(clientId: string, advisorId: string): Promise<AdvisorClient> {
    // Verificar que el advisor es comisionista
    const advisor = await this.userRepo.findOne({
      where: { identity_document: advisorId },
      relations: ['roles', 'account']
    });

    const client = await this.userRepo.findOne({
      where: { identity_document: clientId }
    });

    if (!advisor) throw new NotFoundException('Comisionista no encontrado');
    if (!client) throw new NotFoundException('Cliente no encontrado');
    
    const isAdvisor = advisor.roles.some(role => role.name === 'comisionista');
    if (!isAdvisor) throw new NotFoundException('El usuario no es comisionista');

    // Crear o actualizar relación
    let relation = await this.advisorClientRepo.findOne({
      where: { clientId }
    });

    if (relation) {
      relation.advisorId = advisorId;
      relation.is_active = true;
    } else {
      relation = this.advisorClientRepo.create({
        clientId,
        advisorId
      });
    }

    // Enviar notificación al comisionista
    this.notificationService.sendAdvisorAssignedNotification(advisor, client)
      .catch(error => {
        console.error('Error enviando notificación:', error);
      });

    return this.advisorClientRepo.save(relation);
  }

  async getAssignedAdvisor(clientId: string): Promise<User | null> {
    const relation = await this.advisorClientRepo.findOne({
      where: { clientId, is_active: true },
      relations: ['advisor']
    });
    const advisor = relation?.advisor || null;

    if(!advisor) return null;

    return {
      identity_document: advisor.identity_document,
      first_name: advisor.first_name,
      last_name: advisor.last_name,
      phone: advisor.phone,
    } as User;
  }
}