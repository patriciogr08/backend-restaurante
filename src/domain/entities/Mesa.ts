import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index,
    Check,
} from 'typeorm';
import { Carrito } from './Carrito';
import { OcupacionMesa } from '../../types/domain';

@Entity('mesa')
@Check(`numero > 0`)
@Check(`capacidad > 0`)
@Index(['ocupacion']) // opcional: acelera filtros por estado
export class Mesa {
    @PrimaryGeneratedColumn()
    id!: number;

    @Index({ unique: true })
    @Column({ type: 'int' })
    numero!: number;

    @Column({ type: 'int' })
    capacidad!: number;

    @Column({ type: 'enum', enum: ['LIBRE', 'OCUPADA', 'EN_COBRO'], default: 'LIBRE' })
    ocupacion!: OcupacionMesa;

    @CreateDateColumn({ type: 'datetime' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime', nullable: true })
    updatedAt?: Date;

    @OneToMany(() => Carrito, c => c.mesa)
    carritos!: Carrito[];
}
