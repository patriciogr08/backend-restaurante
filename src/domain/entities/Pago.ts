import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    Index,
    JoinColumn,
    Check,
} from 'typeorm';
import { Factura } from './Factura';

@Entity('pago')
@Check(`monto > 0`)
@Index(['metodo', 'referencia'], { unique: true }) // opcional: evita duplicar misma referencia de transferencia
export class Pago {
    @PrimaryGeneratedColumn()
    id!: number;

    @Index()
    @Column({ type: 'int' })
    facturaId!: number;

    @ManyToOne(() => Factura, f => f.pagos, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
    @JoinColumn({ name: 'facturaId' })
    factura!: Factura;

    @Column({ type: 'enum', enum: ['EFECTIVO', 'TRANSFERENCIA'] })
    metodo!: 'EFECTIVO' | 'TRANSFERENCIA';

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    monto!: string;

    @Column({ type: 'varchar', length: 120, nullable: true })
    referencia?: string;

    @Column({ type: 'enum', enum: ['CONFIRMADO', 'RECHAZADO'], default: 'CONFIRMADO' })
    estado!: 'CONFIRMADO' | 'RECHAZADO';

    // Comprobante (imagen) – ruta pública relativa (e.g., /images/evidencias/xxx.webp)
    @Column({ type: 'varchar', length: 255, nullable: true })
    evidenciaUrl?: string;

    @CreateDateColumn({ type: 'datetime' })
    createdAt!: Date;
}
