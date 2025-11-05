// src/domain/entities/Usuario.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToMany, Index
} from 'typeorm';
import { Carrito } from './Carrito';
import { Auditoria } from './Auditoria';
import type { Rol, EstadoUsuario } from '../../types/domain';

@Entity('usuario')
export class Usuario {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 120 })         // <- tipo explícito
    nombre!: string;

    @Index({ unique: true })
    @Column({ type: 'varchar', length: 60 })           // <- tipo explícito
    usuario!: string;

    // Email opcional y único (MySQL permite múltiples NULL en UNIQUE)
    @Index({ unique: true })
    @Column({ type: 'varchar', length: 160, nullable: true })
    email!: string | null;

    @Column({ type: 'varchar', length: 255 })          // <- tipo explícito
    hash!: string;

    @Column({ type: 'enum', enum: ['ADMIN', 'MESERO', 'DESPACHADOR'] })
    rol!: Rol;

    @Column({ type: 'enum', enum: ['ACTIVO', 'INACTIVO'], default: 'ACTIVO' })
    estado!: EstadoUsuario;

    @CreateDateColumn({ type: 'datetime' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime', nullable: true })
    updatedAt?: Date;

    @OneToMany(() => Carrito, c => c.mesero)
    carritos!: Carrito[];

    @OneToMany(() => Auditoria, a => a.usuario)
    auditoria!: Auditoria[];
}
