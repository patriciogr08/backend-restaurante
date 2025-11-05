import 'reflect-metadata';
import { DataSource } from 'typeorm';
import path from 'path';
import { env } from './env';

const isTs = __filename.endsWith('.ts');

export const AppDataSource = new DataSource({
    type: 'mysql',
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    timezone: env.DB_TIMEZONE,
    charset: 'utf8mb4',
    synchronize: false,
    logging: false,
    entities: [path.join(__dirname, '..', 'domain', 'entities', isTs ? '*.ts' : '*.js')],
    migrations: [path.join(__dirname, '..', 'migrations', isTs ? '*.ts' : '*.js')],
});

export async function initDataSource() {
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
        await AppDataSource.query(`SET time_zone = '${env.DB_TIMEZONE}';`);
    }
    return AppDataSource;
}
