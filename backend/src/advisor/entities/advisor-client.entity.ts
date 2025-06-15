// src/advisor/entities/advisor-client.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';
import { User } from 'src/users/users.entity';

@Entity()
export class AdvisorClient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'client_id' })
  clientId: string; // identity_document del cliente

  @Column({ name: 'advisor_id' })
  advisorId: string; // identity_document del comisionista

  @ManyToOne(() => User)
  @JoinColumn({ name: 'client_id', referencedColumnName: 'identity_document' })
  client: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'advisor_id', referencedColumnName: 'identity_document' })
  advisor: User;

  @CreateDateColumn()
  assigned_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ default: true })
  is_active: boolean;
}