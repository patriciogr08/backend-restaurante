import 'reflect-metadata';
import { DataSource } from 'typeorm';
import path from 'path';
import { env } from './env';

const isTs = __filename.endsWith('.ts');
const root = process.cwd(); // proyecto


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
    entities: [
        path.join(root, 'src/domain/entities/*.{ts,js}'),
        path.join(root, 'dist/domain/entities/*.js'),
    ],
    migrations: [
        path.join(root, 'src/migrations/*.{ts,js}'),
        path.join(root, 'dist/migrations/*.js'),
    ],
    migrationsTableName: 'migrations',
});

export async function initDataSource() {
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
        await AppDataSource.query(`SET time_zone = '${env.DB_TIMEZONE}';`);
    }
    return AppDataSource;
}
