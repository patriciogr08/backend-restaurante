// src/domain/entities/CarritoItem.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    Check,
    JoinColumn,
} from 'typeorm';
import { Carrito } from './Carrito';
import { Producto } from './Producto';

@Entity('carritoItem')
@Check(`cantidad > 0`)
@Check(`descuentoPorcentaje >= 0 AND descuentoPorcentaje <= 100`)
@Check(`descuentoValor >= 0`)
@Check(`(tieneDescuento = 0 AND descuentoPorcentaje = 0 AND descuentoValor = 0) OR (tieneDescuento = 1 AND (descuentoPorcentaje > 0 OR descuentoValor > 0))`)
@Index(['carritoId', 'productoId']) // opcional: acelera consultas por carrito+producto
export class CarritoItem {
    @PrimaryGeneratedColumn()
    id!: number;

    @Index()
    @Column({ type: 'int' })
    carritoId!: number;

    @ManyToOne(() => Carrito, c => c.items, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
    @JoinColumn({ name: 'carritoId' })
    carrito!: Carrito;

    @Index()
    @Column({ type: 'int' })
    productoId!: number;

    @ManyToOne(() => Producto, p => p.carritoItems, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
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

    @CreateDateColumn({ type: 'datetime' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime', nullable: true })
    updatedAt?: Date;
}
