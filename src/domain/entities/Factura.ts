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
import { Pedido } from './Pedido';
import { FacturaItem } from './FacturaItem';
import { Pago } from './Pago';

@Entity('factura')
@Index(['pedidoId', 'estado']) // opcional: consultas por pedido y estado
export class Factura {
    @PrimaryGeneratedColumn()
    id!: number;

    @Index()
    @Column({ type: 'int' })
    pedidoId!: number;

    @ManyToOne(() => Pedido, p => p.facturas, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
    @JoinColumn({ name: 'pedidoId' })
    pedido!: Pedido;

    @Index({ unique: true })
    @Column({ type: 'varchar', length: 40 })
    numero!: string;

    @Index()
    @Column({ type: 'enum', enum: ['EFECTIVO', 'TRANSFERENCIA'] })
    metodoPago!: 'EFECTIVO' | 'TRANSFERENCIA';

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    propinaMonto!: string;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    total!: string;

    @Index()
    @Column({ type: 'enum', enum: ['EMITIDA', 'ANULADA'], default: 'EMITIDA' })
    estado!: 'EMITIDA' | 'ANULADA';

    @Column({ type: 'varchar', length: 255, nullable: true })
    evidenciaUrl?: string;

    @CreateDateColumn({ type: 'datetime' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime', nullable: true })
    updatedAt?: Date;

    @OneToMany(() => FacturaItem, fi => fi.factura, { cascade: true })
    items!: FacturaItem[];

    @OneToMany(() => Pago, p => p.factura, { cascade: true })
    pagos!: Pago[];
}
