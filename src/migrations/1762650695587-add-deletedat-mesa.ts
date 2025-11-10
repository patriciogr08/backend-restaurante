import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeletedatMesa1762650695587 implements MigrationInterface {
    name = 'AddDeletedatMesa1762650695587'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`mesa\` ADD \`deletedAt\` datetime(6) NULL`);
        await queryRunner.query(`DROP INDEX \`IDX_607f6975fb27b0080592f1b092\` ON \`pago\``);
        await queryRunner.query(`ALTER TABLE \`pago\` CHANGE \`referencia\` \`referencia\` varchar(120) NULL`);
        await queryRunner.query(`ALTER TABLE \`pago\` CHANGE \`evidenciaUrl\` \`evidenciaUrl\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`factura\` CHANGE \`evidenciaUrl\` \`evidenciaUrl\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`pedido\` CHANGE \`despachadoAt\` \`despachadoAt\` datetime NULL`);
        await queryRunner.query(`ALTER TABLE \`pedido\` CHANGE \`cobradoAt\` \`cobradoAt\` datetime NULL`);
        await queryRunner.query(`ALTER TABLE \`pedidoitem\` CHANGE \`notas\` \`notas\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`producto\` CHANGE \`descripcion\` \`descripcion\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`carritoitem\` CHANGE \`notas\` \`notas\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`auditoria\` DROP COLUMN \`antesJson\``);
        await queryRunner.query(`ALTER TABLE \`auditoria\` ADD \`antesJson\` json NULL`);
        await queryRunner.query(`ALTER TABLE \`auditoria\` DROP COLUMN \`despuesJson\``);
        await queryRunner.query(`ALTER TABLE \`auditoria\` ADD \`despuesJson\` json NULL`);
        await queryRunner.query(`ALTER TABLE \`usuario\` CHANGE \`email\` \`email\` varchar(160) NULL`);
        await queryRunner.query(`ALTER TABLE \`usuario\` CHANGE \`telefono\` \`telefono\` varchar(30) NULL`);
        await queryRunner.query(`ALTER TABLE \`usuario\` CHANGE \`avatarUrl\` \`avatarUrl\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`configfiscal\` CHANGE \`vigenteHasta\` \`vigenteHasta\` datetime NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_607f6975fb27b0080592f1b092\` ON \`pago\` (\`metodo\`, \`referencia\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_607f6975fb27b0080592f1b092\` ON \`pago\``);
        await queryRunner.query(`ALTER TABLE \`configfiscal\` CHANGE \`vigenteHasta\` \`vigenteHasta\` datetime NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`usuario\` CHANGE \`avatarUrl\` \`avatarUrl\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`usuario\` CHANGE \`telefono\` \`telefono\` varchar(30) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`usuario\` CHANGE \`email\` \`email\` varchar(160) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`auditoria\` DROP COLUMN \`despuesJson\``);
        await queryRunner.query(`ALTER TABLE \`auditoria\` ADD \`despuesJson\` longtext COLLATE "utf8mb4_bin" NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`auditoria\` DROP COLUMN \`antesJson\``);
        await queryRunner.query(`ALTER TABLE \`auditoria\` ADD \`antesJson\` longtext COLLATE "utf8mb4_bin" NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`carritoitem\` CHANGE \`notas\` \`notas\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`producto\` CHANGE \`descripcion\` \`descripcion\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`pedidoitem\` CHANGE \`notas\` \`notas\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`pedido\` CHANGE \`cobradoAt\` \`cobradoAt\` datetime NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`pedido\` CHANGE \`despachadoAt\` \`despachadoAt\` datetime NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`factura\` CHANGE \`evidenciaUrl\` \`evidenciaUrl\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`pago\` CHANGE \`evidenciaUrl\` \`evidenciaUrl\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`pago\` CHANGE \`referencia\` \`referencia\` varchar(120) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_607f6975fb27b0080592f1b092\` ON \`pago\` (\`metodo\`, \`referencia\`)`);
        await queryRunner.query(`ALTER TABLE \`mesa\` DROP COLUMN \`deletedAt\``);
    }

}
