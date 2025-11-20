// src/ws/socket.ts
import http from 'http';
import { Server, Socket } from 'socket.io';

let io: Server | null = null;

/**
 * Inicializa Socket.IO sobre el servidor HTTP.
 */
export function initSocket(server: http.Server) {
    io = new Server(server, {
        cors: {
            origin: '*', // ajusta según tu frontend
        },
    });

    io.on('connection', (socket: Socket) => {
        console.log('Cliente WS conectado:', socket.id);

        /**
         * El front, apenas conecta, debe mandar algo como:
         * socket.emit('register', { rol: 'MESERO', usuarioId: 10 });
         * socket.emit('register', { rol: 'ADMIN' });
         * socket.emit('register', { rol: 'DESPACHADOR' });
         */
        socket.on('register', (data: any) => {
            const { rol, usuarioId } = data || {};
            console.log('WS register:', data);

            if (!rol) return;

            if (rol === 'ADMIN') {
                socket.join('admin');
            }

            if (rol === 'DESPACHADOR') {
                socket.join('despachador');
            }

            if (rol === 'MESERO') {
                if (usuarioId) {
                    socket.join(`mesero:${usuarioId}`);
                }
            }
        });

        socket.on('disconnect', () => {
            console.log('Cliente WS desconectado:', socket.id);
        });
    });

    console.log('Socket.IO inicializado (modo restaurante único)');
}

/**
 * Devuelve la instancia de io, o lanza error si no fue inicializada.
 */
export function getIO(): Server {
    if (!io) {
        throw new Error('Socket.IO no ha sido inicializado. Llama initSocket(server) en server.ts');
    }
    return io;
}
