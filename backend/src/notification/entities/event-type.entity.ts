// src/notification/entities/event-type.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class EventType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  description: string;

  @Column({ default: false })
  is_premium: boolean;

  // Método estático para obtener los tipos de eventos iniciales
  static getInitialEvents(): Partial<EventType>[] {
    return [
      {
        code: 'ADVISOR_ASSIGNED',
        description: 'Asignación de nuevo inversor a comisionista',
        is_premium: false
      },
    ];
  }
}