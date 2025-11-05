import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoInit1762377602945 implements MigrationInterface {
    name = 'AutoInit1762377602945'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`mesa\` (\`id\` int NOT NULL AUTO_INCREMENT, \`numero\` int NOT NULL, \`capacidad\` int NOT NULL, \`ocupacion\` enum ('LIBRE', 'OCUPADA', 'EN_COBRO') NOT NULL DEFAULT 'LIBRE', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_905ff4a07c147aea02ed9f545b\` (\`numero\`), INDEX \`IDX_d12074a60e7996be5292733951\` (\`ocupacion\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`tipoProducto\` (\`id\` int NOT NULL AUTO_INCREMENT, \`nombre\` varchar(80) NOT NULL, \`estado\` enum ('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_ece8be863d7248b96e7362a9cc\` (\`nombre\`), INDEX \`IDX_67143d7a2c6a26fa4eb1e2bcc8\` (\`estado\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`facturaItem\` (\`id\` int NOT NULL AUTO_INCREMENT, \`facturaId\` int NOT NULL, \`pedidoItemId\` int NOT NULL, \`cantidad\` int NOT NULL, \`precioUnitario\` decimal(10,2) NOT NULL, \`discountUnit\` decimal(10,2) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_a36d21e668356c7f7736696512\` (\`facturaId\`), INDEX \`IDX_0df3e672e5109fe12c422961e9\` (\`pedidoItemId\`), INDEX \`IDX_229e9041935b8aad97c469b941\` (\`facturaId\`, \`pedidoItemId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`pago\` (\`id\` int NOT NULL AUTO_INCREMENT, \`facturaId\` int NOT NULL, \`metodo\` enum ('EFECTIVO', 'TRANSFERENCIA') NOT NULL, \`monto\` decimal(12,2) NOT NULL, \`referencia\` varchar(120) NULL, \`estado\` enum ('CONFIRMADO', 'RECHAZADO') NOT NULL DEFAULT 'CONFIRMADO', \`evidenciaUrl\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_650217eb40cae181d1bc651ff1\` (\`facturaId\`), UNIQUE INDEX \`IDX_607f6975fb27b0080592f1b092\` (\`metodo\`, \`referencia\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`factura\` (\`id\` int NOT NULL AUTO_INCREMENT, \`pedidoId\` int NOT NULL, \`numero\` varchar(40) NOT NULL, \`metodoPago\` enum ('EFECTIVO', 'TRANSFERENCIA') NOT NULL, \`propinaMonto\` decimal(12,2) NOT NULL DEFAULT '0.00', \`total\` decimal(12,2) NOT NULL, \`estado\` enum ('EMITIDA', 'ANULADA') NOT NULL DEFAULT 'EMITIDA', \`evidenciaUrl\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_7752c508f05fea9473afd6c03c\` (\`pedidoId\`), UNIQUE INDEX \`IDX_393c240e12215225afd2d32eb4\` (\`numero\`), INDEX \`IDX_a5502765ed697b8a41633ffb3e\` (\`metodoPago\`), INDEX \`IDX_9fadcf46a3f35232515cf4eeff\` (\`estado\`), INDEX \`IDX_bd9d038446a6ae7c09dcb69899\` (\`pedidoId\`, \`estado\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`pedido\` (\`id\` int NOT NULL AUTO_INCREMENT, \`mesaId\` int NOT NULL, \`meseroId\` int NOT NULL, \`estado\` enum ('EN_PROCESO', 'DESPACHADO', 'COBRADO', 'CANCELADO') NOT NULL DEFAULT 'EN_PROCESO', \`ivaPercent\` decimal(5,2) NOT NULL, \`subtotal\` decimal(12,2) NOT NULL DEFAULT '0.00', \`ivaMonto\` decimal(12,2) NOT NULL DEFAULT '0.00', \`propinaMonto\` decimal(12,2) NOT NULL DEFAULT '0.00', \`total\` decimal(12,2) NOT NULL DEFAULT '0.00', \`despachadoAt\` datetime NULL, \`cobradoAt\` datetime NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_3eba14db7ef6a4ddb4a726a6d2\` (\`mesaId\`), INDEX \`IDX_3b33351737d9b9c16e93d9780a\` (\`meseroId\`), INDEX \`IDX_076f2a4e67d5232136ed070884\` (\`estado\`), INDEX \`IDX_8469d822cc713ec621ac627b19\` (\`mesaId\`, \`estado\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`pedidoItem\` (\`id\` int NOT NULL AUTO_INCREMENT, \`pedidoId\` int NOT NULL, \`productoId\` int NOT NULL, \`precioUnitario\` decimal(10,2) NOT NULL, \`cantidad\` int NOT NULL, \`notas\` varchar(255) NULL, \`tieneDescuento\` tinyint NOT NULL DEFAULT 0, \`descuentoPorcentaje\` decimal(5,2) NOT NULL DEFAULT '0.00', \`descuentoValor\` decimal(10,2) NOT NULL DEFAULT '0.00', \`isExtra\` tinyint NOT NULL DEFAULT 0, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_b0ac2c6863ccd97d636612dddd\` (\`pedidoId\`), INDEX \`IDX_788f0590951a4073397d143042\` (\`productoId\`), INDEX \`IDX_4d06ccf0991b9c8acb76a1fa96\` (\`isExtra\`), INDEX \`IDX_f857a6086bd01fec8acbb3e4fa\` (\`pedidoId\`, \`createdAt\`), INDEX \`IDX_b59dc3506cf177200c1c7ed636\` (\`pedidoId\`, \`productoId\`, \`isExtra\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`producto\` (\`id\` int NOT NULL AUTO_INCREMENT, \`tipoProductoId\` int NOT NULL, \`nombre\` varchar(120) NOT NULL, \`descripcion\` varchar(255) NULL, \`precio\` decimal(10,2) NOT NULL, \`estado\` enum ('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO', \`tieneDescuento\` tinyint NOT NULL DEFAULT 0, \`descuentoPorcentaje\` decimal(5,2) NOT NULL DEFAULT '0.00', \`descuentoValor\` decimal(10,2) NOT NULL DEFAULT '0.00', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_c895bdba11a5ec9739011392e9\` (\`tipoProductoId\`), INDEX \`IDX_eef9ddb03d5196d4afaf3ac2cd\` (\`estado\`), INDEX \`IDX_218a69d52300a4d8eadb41c1e8\` (\`tipoProductoId\`, \`estado\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`carritoItem\` (\`id\` int NOT NULL AUTO_INCREMENT, \`carritoId\` int NOT NULL, \`productoId\` int NOT NULL, \`precioUnitario\` decimal(10,2) NOT NULL, \`cantidad\` int NOT NULL, \`notas\` varchar(255) NULL, \`tieneDescuento\` tinyint NOT NULL DEFAULT 0, \`descuentoPorcentaje\` decimal(5,2) NOT NULL DEFAULT '0.00', \`descuentoValor\` decimal(10,2) NOT NULL DEFAULT '0.00', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_28a75957d5eb83d78ed5ea3812\` (\`carritoId\`), INDEX \`IDX_52304aa4151370c221b159a680\` (\`productoId\`), INDEX \`IDX_072b1551d4ebe483d6ffc47097\` (\`carritoId\`, \`productoId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`carrito\` (\`id\` int NOT NULL AUTO_INCREMENT, \`mesaId\` int NOT NULL, \`meseroId\` int NOT NULL, \`estado\` enum ('ACTIVO', 'CANCELADO') NOT NULL DEFAULT 'ACTIVO', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_12a4ee969f06a9a74ba219fc10\` (\`mesaId\`), INDEX \`IDX_a9e84c5a86dee5a900c13ce9d9\` (\`meseroId\`), INDEX \`IDX_ccd46bff8a0f4fc4454e372d25\` (\`estado\`), INDEX \`IDX_69cf3d97da8492039ef4aac361\` (\`mesaId\`, \`estado\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`auditoria\` (\`id\` int NOT NULL AUTO_INCREMENT, \`usuarioId\` int NOT NULL, \`entidad\` varchar(80) NOT NULL, \`entidadId\` int NOT NULL, \`accion\` varchar(80) NOT NULL, \`antesJson\` json NULL, \`despuesJson\` json NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_f913378245e2c5fd5514691f32\` (\`usuarioId\`), INDEX \`IDX_37e2ecac03a7871d20628ac441\` (\`entidad\`), INDEX \`IDX_65278ed85b76d2872efed8559f\` (\`entidadId\`), INDEX \`IDX_1c8f665cccd60451a6a5992df4\` (\`entidad\`, \`entidadId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`usuario\` (\`id\` int NOT NULL AUTO_INCREMENT, \`nombre\` varchar(120) NOT NULL, \`usuario\` varchar(60) NOT NULL, \`email\` varchar(160) NULL, \`hash\` varchar(255) NOT NULL, \`rol\` enum ('ADMIN', 'MESERO', 'DESPACHADOR') NOT NULL, \`estado\` enum ('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_9921cd8ed63a072b8f93ead80f\` (\`usuario\`), UNIQUE INDEX \`IDX_2863682842e688ca198eb25c12\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`configFiscal\` (\`id\` int NOT NULL AUTO_INCREMENT, \`ivaPercent\` decimal(5,2) NOT NULL, \`vigenteDesde\` datetime NOT NULL, \`vigenteHasta\` datetime NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_60742ab91bc7a3b35ba2c3dd96\` (\`vigenteDesde\`), INDEX \`IDX_cdf0dfba7535e44af9636cb05c\` (\`vigenteHasta\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`facturaItem\` ADD CONSTRAINT \`FK_a36d21e668356c7f77366965125\` FOREIGN KEY (\`facturaId\`) REFERENCES \`factura\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT`);
        await queryRunner.query(`ALTER TABLE \`facturaItem\` ADD CONSTRAINT \`FK_0df3e672e5109fe12c422961e99\` FOREIGN KEY (\`pedidoItemId\`) REFERENCES \`pedidoItem\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT`);
        await queryRunner.query(`ALTER TABLE \`pago\` ADD CONSTRAINT \`FK_650217eb40cae181d1bc651ff19\` FOREIGN KEY (\`facturaId\`) REFERENCES \`factura\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT`);
        await queryRunner.query(`ALTER TABLE \`factura\` ADD CONSTRAINT \`FK_7752c508f05fea9473afd6c03c1\` FOREIGN KEY (\`pedidoId\`) REFERENCES \`pedido\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT`);
        await queryRunner.query(`ALTER TABLE \`pedido\` ADD CONSTRAINT \`FK_3eba14db7ef6a4ddb4a726a6d28\` FOREIGN KEY (\`mesaId\`) REFERENCES \`mesa\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT`);
        await queryRunner.query(`ALTER TABLE \`pedido\` ADD CONSTRAINT \`FK_3b33351737d9b9c16e93d9780a3\` FOREIGN KEY (\`meseroId\`) REFERENCES \`usuario\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT`);
        await queryRunner.query(`ALTER TABLE \`pedidoItem\` ADD CONSTRAINT \`FK_b0ac2c6863ccd97d636612dddd0\` FOREIGN KEY (\`pedidoId\`) REFERENCES \`pedido\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT`);
        await queryRunner.query(`ALTER TABLE \`pedidoItem\` ADD CONSTRAINT \`FK_788f0590951a4073397d143042e\` FOREIGN KEY (\`productoId\`) REFERENCES \`producto\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT`);
        await queryRunner.query(`ALTER TABLE \`producto\` ADD CONSTRAINT \`FK_c895bdba11a5ec9739011392e90\` FOREIGN KEY (\`tipoProductoId\`) REFERENCES \`tipoProducto\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT`);
        await queryRunner.query(`ALTER TABLE \`carritoItem\` ADD CONSTRAINT \`FK_28a75957d5eb83d78ed5ea3812a\` FOREIGN KEY (\`carritoId\`) REFERENCES \`carrito\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT`);
        await queryRunner.query(`ALTER TABLE \`carritoItem\` ADD CONSTRAINT \`FK_52304aa4151370c221b159a6809\` FOREIGN KEY (\`productoId\`) REFERENCES \`producto\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT`);
        await queryRunner.query(`ALTER TABLE \`carrito\` ADD CONSTRAINT \`FK_12a4ee969f06a9a74ba219fc107\` FOREIGN KEY (\`mesaId\`) REFERENCES \`mesa\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT`);
        await queryRunner.query(`ALTER TABLE \`carrito\` ADD CONSTRAINT \`FK_a9e84c5a86dee5a900c13ce9d9f\` FOREIGN KEY (\`meseroId\`) REFERENCES \`usuario\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT`);
        await queryRunner.query(`ALTER TABLE \`auditoria\` ADD CONSTRAINT \`FK_f913378245e2c5fd5514691f327\` FOREIGN KEY (\`usuarioId\`) REFERENCES \`usuario\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`auditoria\` DROP FOREIGN KEY \`FK_f913378245e2c5fd5514691f327\``);
        await queryRunner.query(`ALTER TABLE \`carrito\` DROP FOREIGN KEY \`FK_a9e84c5a86dee5a900c13ce9d9f\``);
        await queryRunner.query(`ALTER TABLE \`carrito\` DROP FOREIGN KEY \`FK_12a4ee969f06a9a74ba219fc107\``);
        await queryRunner.query(`ALTER TABLE \`carritoItem\` DROP FOREIGN KEY \`FK_52304aa4151370c221b159a6809\``);
        await queryRunner.query(`ALTER TABLE \`carritoItem\` DROP FOREIGN KEY \`FK_28a75957d5eb83d78ed5ea3812a\``);
        await queryRunner.query(`ALTER TABLE \`producto\` DROP FOREIGN KEY \`FK_c895bdba11a5ec9739011392e90\``);
        await queryRunner.query(`ALTER TABLE \`pedidoItem\` DROP FOREIGN KEY \`FK_788f0590951a4073397d143042e\``);
        await queryRunner.query(`ALTER TABLE \`pedidoItem\` DROP FOREIGN KEY \`FK_b0ac2c6863ccd97d636612dddd0\``);
        await queryRunner.query(`ALTER TABLE \`pedido\` DROP FOREIGN KEY \`FK_3b33351737d9b9c16e93d9780a3\``);
        await queryRunner.query(`ALTER TABLE \`pedido\` DROP FOREIGN KEY \`FK_3eba14db7ef6a4ddb4a726a6d28\``);
        await queryRunner.query(`ALTER TABLE \`factura\` DROP FOREIGN KEY \`FK_7752c508f05fea9473afd6c03c1\``);
        await queryRunner.query(`ALTER TABLE \`pago\` DROP FOREIGN KEY \`FK_650217eb40cae181d1bc651ff19\``);
        await queryRunner.query(`ALTER TABLE \`facturaItem\` DROP FOREIGN KEY \`FK_0df3e672e5109fe12c422961e99\``);
        await queryRunner.query(`ALTER TABLE \`facturaItem\` DROP FOREIGN KEY \`FK_a36d21e668356c7f77366965125\``);
        await queryRunner.query(`DROP INDEX \`IDX_cdf0dfba7535e44af9636cb05c\` ON \`configFiscal\``);
        await queryRunner.query(`DROP INDEX \`IDX_60742ab91bc7a3b35ba2c3dd96\` ON \`configFiscal\``);
        await queryRunner.query(`DROP TABLE \`configFiscal\``);
        await queryRunner.query(`DROP INDEX \`IDX_2863682842e688ca198eb25c12\` ON \`usuario\``);
        await queryRunner.query(`DROP INDEX \`IDX_9921cd8ed63a072b8f93ead80f\` ON \`usuario\``);
        await queryRunner.query(`DROP TABLE \`usuario\``);
        await queryRunner.query(`DROP INDEX \`IDX_1c8f665cccd60451a6a5992df4\` ON \`auditoria\``);
        await queryRunner.query(`DROP INDEX \`IDX_65278ed85b76d2872efed8559f\` ON \`auditoria\``);
        await queryRunner.query(`DROP INDEX \`IDX_37e2ecac03a7871d20628ac441\` ON \`auditoria\``);
        await queryRunner.query(`DROP INDEX \`IDX_f913378245e2c5fd5514691f32\` ON \`auditoria\``);
        await queryRunner.query(`DROP TABLE \`auditoria\``);
        await queryRunner.query(`DROP INDEX \`IDX_69cf3d97da8492039ef4aac361\` ON \`carrito\``);
        await queryRunner.query(`DROP INDEX \`IDX_ccd46bff8a0f4fc4454e372d25\` ON \`carrito\``);
        await queryRunner.query(`DROP INDEX \`IDX_a9e84c5a86dee5a900c13ce9d9\` ON \`carrito\``);
        await queryRunner.query(`DROP INDEX \`IDX_12a4ee969f06a9a74ba219fc10\` ON \`carrito\``);
        await queryRunner.query(`DROP TABLE \`carrito\``);
        await queryRunner.query(`DROP INDEX \`IDX_072b1551d4ebe483d6ffc47097\` ON \`carritoItem\``);
        await queryRunner.query(`DROP INDEX \`IDX_52304aa4151370c221b159a680\` ON \`carritoItem\``);
        await queryRunner.query(`DROP INDEX \`IDX_28a75957d5eb83d78ed5ea3812\` ON \`carritoItem\``);
        await queryRunner.query(`DROP TABLE \`carritoItem\``);
        await queryRunner.query(`DROP INDEX \`IDX_218a69d52300a4d8eadb41c1e8\` ON \`producto\``);
        await queryRunner.query(`DROP INDEX \`IDX_eef9ddb03d5196d4afaf3ac2cd\` ON \`producto\``);
        await queryRunner.query(`DROP INDEX \`IDX_c895bdba11a5ec9739011392e9\` ON \`producto\``);
        await queryRunner.query(`DROP TABLE \`producto\``);
        await queryRunner.query(`DROP INDEX \`IDX_b59dc3506cf177200c1c7ed636\` ON \`pedidoItem\``);
        await queryRunner.query(`DROP INDEX \`IDX_f857a6086bd01fec8acbb3e4fa\` ON \`pedidoItem\``);
        await queryRunner.query(`DROP INDEX \`IDX_4d06ccf0991b9c8acb76a1fa96\` ON \`pedidoItem\``);
        await queryRunner.query(`DROP INDEX \`IDX_788f0590951a4073397d143042\` ON \`pedidoItem\``);
        await queryRunner.query(`DROP INDEX \`IDX_b0ac2c6863ccd97d636612dddd\` ON \`pedidoItem\``);
        await queryRunner.query(`DROP TABLE \`pedidoItem\``);
        await queryRunner.query(`DROP INDEX \`IDX_8469d822cc713ec621ac627b19\` ON \`pedido\``);
        await queryRunner.query(`DROP INDEX \`IDX_076f2a4e67d5232136ed070884\` ON \`pedido\``);
        await queryRunner.query(`DROP INDEX \`IDX_3b33351737d9b9c16e93d9780a\` ON \`pedido\``);
        await queryRunner.query(`DROP INDEX \`IDX_3eba14db7ef6a4ddb4a726a6d2\` ON \`pedido\``);
        await queryRunner.query(`DROP TABLE \`pedido\``);
        await queryRunner.query(`DROP INDEX \`IDX_bd9d038446a6ae7c09dcb69899\` ON \`factura\``);
        await queryRunner.query(`DROP INDEX \`IDX_9fadcf46a3f35232515cf4eeff\` ON \`factura\``);
        await queryRunner.query(`DROP INDEX \`IDX_a5502765ed697b8a41633ffb3e\` ON \`factura\``);
        await queryRunner.query(`DROP INDEX \`IDX_393c240e12215225afd2d32eb4\` ON \`factura\``);
        await queryRunner.query(`DROP INDEX \`IDX_7752c508f05fea9473afd6c03c\` ON \`factura\``);
        await queryRunner.query(`DROP TABLE \`factura\``);
        await queryRunner.query(`DROP INDEX \`IDX_607f6975fb27b0080592f1b092\` ON \`pago\``);
        await queryRunner.query(`DROP INDEX \`IDX_650217eb40cae181d1bc651ff1\` ON \`pago\``);
        await queryRunner.query(`DROP TABLE \`pago\``);
        await queryRunner.query(`DROP INDEX \`IDX_229e9041935b8aad97c469b941\` ON \`facturaItem\``);
        await queryRunner.query(`DROP INDEX \`IDX_0df3e672e5109fe12c422961e9\` ON \`facturaItem\``);
        await queryRunner.query(`DROP INDEX \`IDX_a36d21e668356c7f7736696512\` ON \`facturaItem\``);
        await queryRunner.query(`DROP TABLE \`facturaItem\``);
        await queryRunner.query(`DROP INDEX \`IDX_67143d7a2c6a26fa4eb1e2bcc8\` ON \`tipoProducto\``);
        await queryRunner.query(`DROP INDEX \`IDX_ece8be863d7248b96e7362a9cc\` ON \`tipoProducto\``);
        await queryRunner.query(`DROP TABLE \`tipoProducto\``);
        await queryRunner.query(`DROP INDEX \`IDX_d12074a60e7996be5292733951\` ON \`mesa\``);
        await queryRunner.query(`DROP INDEX \`IDX_905ff4a07c147aea02ed9f545b\` ON \`mesa\``);
        await queryRunner.query(`DROP TABLE \`mesa\``);
    }

}
