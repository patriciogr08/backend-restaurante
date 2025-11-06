import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    OneToMany,
} from 'typeorm';
import { Producto } from './Producto';
import type { EstadoCatalogo } from '../../types/domain';

@Entity('tipoproducto')
@Index(['estado']) // opcional: acelera listados por estado
export class TipoProducto {
    @PrimaryGeneratedColumn()
    id!: number;

    @Index({ unique: true })
    @Column({ type: 'varchar', length: 80 })
    nombre!: string;

    @Column({ type: 'enum', enum: ['ACTIVO', 'INACTIVO'], default: 'ACTIVO' })
    estado!: EstadoCatalogo;

    @CreateDateColumn({ type: 'datetime' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime', nullable: true })
    updatedAt?: Date;

    @OneToMany(() => Producto, (p) => p.tipoProducto)
    productos!: Producto[];
}
