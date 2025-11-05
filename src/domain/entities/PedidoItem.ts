import { 
    Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, 
    UpdateDateColumn, Index, Check, OneToMany, JoinColumn 
} from 'typeorm';
import { Pedido } from './Pedido';
import { Producto } from './Producto';
import { FacturaItem } from './FacturaItem';

@Entity('pedidoItem')
@Check(`cantidad > 0`)
@Check(`precioUnitario >= 0`) // ← nuevo
@Check(`descuentoPorcentaje >= 0 AND descuentoPorcentaje <= 100`)
@Check(`descuentoValor >= 0`)
@Check(`(tieneDescuento = 0 AND descuentoPorcentaje = 0 AND descuentoValor = 0) OR (tieneDescuento = 1 AND (descuentoPorcentaje > 0 OR descuentoValor > 0))`)
@Check(`(descuentoPorcentaje = 0 OR descuentoValor = 0)`) // ← nuevo (mutua exclusión)
@Index(['pedidoId', 'productoId', 'isExtra'])
@Index(['pedidoId', 'createdAt'])
export class PedidoItem {
    @PrimaryGeneratedColumn() id!: number;

    @Index() 
    @Column({ type: 'int' })
    pedidoId!: number;

    @ManyToOne(() => Pedido, p => p.items, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
    @JoinColumn({ name: 'pedidoId' })
    pedido!: Pedido;

    @Index() 
    @Column({ type: 'int' })
    productoId!: number;

    @ManyToOne(() => Producto, p => p.pedidoItems, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
    @JoinColumn({ name: 'productoId' })
    producto!: Producto;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    precioUnitario!: string;

    @Column({ type: 'int' })
    cantidad!: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    notas?: string;

    @Column({ type: 'bool', default: false })
    tieneDescuento!: boolean;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    descuentoPorcentaje!: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    descuentoValor!: string;

    @Index()
    @Column({ type: 'bool', default: false })
    isExtra!: boolean;

    @CreateDateColumn({ type: 'datetime' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime', nullable: true })
    updatedAt?: Date;

    @OneToMany(() => FacturaItem, fi => fi.pedidoItem)
    facturaItems!: FacturaItem[];
}
