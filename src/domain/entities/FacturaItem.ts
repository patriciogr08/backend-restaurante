import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    Index,
    Check,
    JoinColumn,
} from 'typeorm';
import { Factura } from './Factura';
import { PedidoItem } from './PedidoItem';

@Entity('facturaitem')
@Check(`cantidad > 0`)
@Index(['facturaId', 'pedidoItemId']) // opcional: acelera búsquedas comunes
export class FacturaItem {
    @PrimaryGeneratedColumn()
    id!: number;

    @Index()
    @Column({ type: 'int' })
    facturaId!: number;

    @ManyToOne(() => Factura, f => f.items, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
    @JoinColumn({ name: 'facturaId' })
    factura!: Factura;

    @Index()
    @Column({ type: 'int' })
    pedidoItemId!: number;

    @ManyToOne(() => PedidoItem, pi => pi.facturaItems, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
    @JoinColumn({ name: 'pedidoItemId' })
    pedidoItem!: PedidoItem;

    @Column({ type: 'int' })
    cantidad!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    precioUnitario!: string;   // guardado como string para evitar float JS

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    discountUnit!: string;     // descuento unitario aplicado

    @CreateDateColumn({ type: 'datetime' })
    createdAt!: Date;
}
