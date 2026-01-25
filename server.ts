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
    const id = socket.id;
    const newPlayer = { id, x: Math.random() * 800, y: Math.random() * 600, angle: Math.random() * 360 };
    socket.emit('userLogin', {players, newPlayer});
    socket.broadcast.emit('newPlayer', newPlayer);
    players.push(newPlayer);
  });

  socket.on('disconnect', () => {
    players = players.filter(p => p.id !== socket.id);
    socket.broadcast.emit('playerDisconnected', socket.id);
  });

  socket.on('move', (data: { id: string; x: number; y: number, angle: number }) => {
    const player = players.find(p => p.id === data.id);
    if (player) {
      player.x = data.x;
      player.y = data.y;
      player.angle = data.angle;
      socket.broadcast.emit('playerMoved', data);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
