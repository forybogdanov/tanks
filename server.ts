import { randomUUID } from 'crypto';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

let players: Array<{ id: string; x: number; y: number, angle: number }> = [];

app.use(express.static('client'));

io.on('connection', (socket) => {
  socket.on('loginRequest', () => {
    const id = randomUUID();
    const newPlayer = { id, x: Math.random() * 800, y: Math.random() * 600, angle: Math.random() * 2 * Math.PI };
    socket.emit('userLogin', {players, newPlayer});
    socket.broadcast.emit('newPlayer', newPlayer);
    players.push(newPlayer);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
