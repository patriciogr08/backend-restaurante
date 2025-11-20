// src/domain/entities/Carrito.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { Mesa } from './Mesa';
import { Usuario } from './Usuario';
import { CarritoItem } from './CarritoItem';

@Entity('carrito')
@Index(['mesaId', 'estado']) // opcional: acelera consultas por mesa y estado
export class Carrito {
    @PrimaryGeneratedColumn()
    id!: number;

    @Index()
    @Column({ type: 'int' })
    mesaId!: number;

    @ManyToOne(() => Mesa, m => m.carritos, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
    @JoinColumn({ name: 'mesaId' })
    mesa!: Mesa;

    @Index()
    @Column({ type: 'int' })
    meseroId!: number;

    @ManyToOne(() => Usuario, u => u.carritos, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
    @JoinColumn({ name: 'meseroId' })
    mesero!: Usuario;

    @Index()
    @Column({ type: 'enum', enum: ['ACTIVO', 'CONSUMIDO', 'CANCELADO'], default: 'ACTIVO' })
    estado!: 'ACTIVO' | 'CONSUMIDO' | 'CANCELADO';

    @CreateDateColumn({ type: 'datetime' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime', nullable: true })
    updatedAt?: Date;

    @OneToMany(() => CarritoItem, i => i.carrito, { cascade: true })
    items!: CarritoItem[];
}
