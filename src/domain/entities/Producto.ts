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
import { TipoProducto } from './TipoProducto';
import { CarritoItem } from './CarritoItem';
import { PedidoItem } from './PedidoItem';

@Entity('producto')
@Check(`precio >= 0`) // opcional: evita precios negativos
@Check(`descuentoPorcentaje >= 0 AND descuentoPorcentaje <= 100`)
@Check(`descuentoValor >= 0`)
@Check(`(tieneDescuento = 0 AND descuentoPorcentaje = 0 AND descuentoValor = 0) OR (tieneDescuento = 1 AND (descuentoPorcentaje > 0 OR descuentoValor > 0))`)
@Index(['tipoProductoId', 'estado']) // acelera listados por categoría/estado
export class Producto {
    @PrimaryGeneratedColumn()
    id!: number;

    @Index()
    @Column({ type: 'int' })
    tipoProductoId!: number;

    @ManyToOne(() => TipoProducto, (tp) => tp.productos, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
    @JoinColumn({ name: 'tipoProductoId' })
    tipoProducto!: TipoProducto;

    @Column({ type: 'varchar', length: 120 })
    nombre!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    descripcion?: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    precio!: string;

    @Index()
    @Column({ type: 'enum', enum: ['ACTIVO', 'INACTIVO'], default: 'ACTIVO' })
    estado!: 'ACTIVO' | 'INACTIVO';

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

    @OneToMany(() => CarritoItem, (ci) => ci.producto)
    carritoItems!: CarritoItem[];

    @OneToMany(() => PedidoItem, (pi) => pi.producto)
    pedidoItems!: PedidoItem[];
}
