import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    Check,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { Mesa } from './Mesa';
import { Usuario } from './Usuario';
import { PedidoItem } from './PedidoItem';
import { Factura } from './Factura';

@Entity('pedido')
@Check(`ivaPercent >= 0 AND ivaPercent <= 100`)
@Index(['mesaId', 'estado']) // opcional: acelera filtros por mesa y estado
export class Pedido {
    @PrimaryGeneratedColumn()
    id!: number;

    @Index()
    @Column({ type: 'int' })
    mesaId!: number;

    // Sin inverse side (a menos que declares Mesa.pedidos)
    @ManyToOne(() => Mesa, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
    @JoinColumn({ name: 'mesaId' })
    mesa!: Mesa;

    @Index()
    @Column({ type: 'int' })
    meseroId!: number;

    // Sin inverse side (a menos que declares Usuario.pedidos)
    @ManyToOne(() => Usuario, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
    @JoinColumn({ name: 'meseroId' })
    mesero!: Usuario;

    @Index()
    @Column({
        type: 'enum',
        enum: ['EN_PROCESO', 'DESPACHADO', 'COBRADO', 'CANCELADO'],
        default: 'EN_PROCESO',
    })
    estado!: 'EN_PROCESO' | 'DESPACHADO' | 'COBRADO' | 'CANCELADO';

    @Column({ type: 'decimal', precision: 5, scale: 2 })
    ivaPercent!: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    subtotal!: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    ivaMonto!: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    propinaMonto!: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    total!: string;

    @Column({ type: 'datetime', nullable: true })
    despachadoAt?: Date | null;

    @Column({ type: 'datetime', nullable: true })
    cobradoAt?: Date | null;

    @CreateDateColumn({ type: 'datetime' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime', nullable: true })
    updatedAt?: Date;

    @OneToMany(() => PedidoItem, (i) => i.pedido, { cascade: true })
    items!: PedidoItem[];

    @OneToMany(() => Factura, (f) => f.pedido)
    facturas!: Factura[];
}
