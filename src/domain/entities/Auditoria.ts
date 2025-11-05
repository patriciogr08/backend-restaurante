// src/domain/entities/Auditoria.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    Index,
    JoinColumn,
} from 'typeorm';
import { Usuario } from './Usuario';

@Entity('auditoria')
@Index(['entidad', 'entidadId']) // opcional, acelera búsquedas por entidad
export class Auditoria {
    @PrimaryGeneratedColumn()
    id!: number;

    @Index()
    @Column({ type: 'int' })
    usuarioId!: number;

    @ManyToOne(() => Usuario, u => u.auditoria, {
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT',
    })
    @JoinColumn({ name: 'usuarioId' })
    usuario!: Usuario;

    @Index()
    @Column({ type: 'varchar', length: 80 })
    entidad!: string;

    @Index()
    @Column({ type: 'int' })
    entidadId!: number;

    @Column({ type: 'varchar', length: 80 })
    accion!: string;

    @Column({ type: 'json', nullable: true })
    antesJson?: any;

    @Column({ type: 'json', nullable: true })
    despuesJson?: any;

    @CreateDateColumn({ type: 'datetime' })
    createdAt!: Date;
}
