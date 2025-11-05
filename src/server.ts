import { app } from './app';
import { env } from './config/env';
import { initDataSource } from './config/data-source';

initDataSource().then(() => {
    app.listen(env.PORT, () => {
        console.log(`API Restaurante en http://localhost:${env.PORT}`);
    });
}).catch((err) => {
    console.error('Error iniciando DataSource:', err);
    process.exit(1);
});
