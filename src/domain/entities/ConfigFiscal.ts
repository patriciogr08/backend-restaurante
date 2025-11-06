// src/domain/entities/ConfigFiscal.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
    Check,
} from 'typeorm';

@Entity('configfiscal')
@Check(`ivaPercent >= 0 AND ivaPercent <= 100`)
export class ConfigFiscal {
    @PrimaryGeneratedColumn()
    id!: number;

    // 15.00 = 15%
    @Column({ type: 'decimal', precision: 5, scale: 2 })
    ivaPercent!: string;

    // Índices útiles para traer la vigente y ordenar por vigencia
    @Index()
    @Column({ type: 'datetime' })
    vigenteDesde!: Date;

    @Index()
    @Column({ type: 'datetime', nullable: true })
    vigenteHasta?: Date | null;

    @CreateDateColumn({ type: 'datetime' })
    createdAt!: Date;
}
