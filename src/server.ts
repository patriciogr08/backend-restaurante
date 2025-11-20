// src/server.ts
import http from 'http';
import { app } from './app';
import { env } from './config/env';
import { initDataSource } from './config/data-source';
import { initSocket } from './ws/socket';

initDataSource()
  .then(() => {
    // 1) Crear HTTP server a partir de Express
    const httpServer = http.createServer(app);

    // 2) Inicializar Socket.IO sobre ese server
    initSocket(httpServer);

    // 3) Levantar el servidor HTTP (Express + WebSockets)
    httpServer.listen(env.PORT, () => {
        console.log(`API Restaurante en http://localhost:${env.PORT}`);
        console.log(`WebSocket escuchando en el mismo puerto ${env.PORT}`);
    });
})
.catch((err) => {
    console.error('Error iniciando DataSource:', err);
    process.exit(1);
    }
);
