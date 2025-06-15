// src/advisor/advisor.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdvisorClient } from './entities/advisor-client.entity';
import { User } from 'src/users/users.entity';
import { Role } from 'src/roles-permission/entities/role.entity';

@Injectable()
export class AdvisorService {
  constructor(
    @InjectRepository(AdvisorClient)
    private readonly advisorClientRepo: Repository<AdvisorClient>,
    
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

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
      relations: ['roles']
    });

    if (!advisor) throw new NotFoundException('Comisionista no encontrado');
    
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

    return this.advisorClientRepo.save(relation);
  }

  async getAssignedAdvisor(clientId: string): Promise<User | null> {
    const relation = await this.advisorClientRepo.findOne({
      where: { clientId, is_active: true },
      relations: ['advisor']
    });

    return relation?.advisor || null;
  }
}