import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { collisionDetectionPointRectServer, degreesToRadians } from './utils';
import { Point, Rect } from './types';

const PROJECTILE_SPEED = 10;
const PROJECTILE_RADIUS = 8;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

let players: Array<{ id: string; x: number; y: number, angle: number, health: number }> = [];
let projectiles: Array<{ id: string; playerId: string; x: number; y: number; direction: number }> = [];

app.use(express.static('client'));

io.on('connection', (socket) => {

  socket.on('loginRequest', () => {
    const id = socket.id;
    const newPlayer = { id, x: Math.random() * 800, y: Math.random() * 600, angle: Math.random() * 360, health: 100 };
    socket.emit('userLogin', {players, newPlayer});
    socket.broadcast.emit('newPlayer', newPlayer);
    players.push(newPlayer);
  });

  socket.on('disconnect', () => {
    players = players.filter(p => p.id !== socket.id);
    socket.broadcast.emit('playerDisconnected', socket.id);
  });

  socket.on('move', (data: { id: string; x: number; y: number, angle: number, health: number }) => {
    const player = players.find(p => p.id === data.id);
    if (player) {
      player.x = data.x;
      player.y = data.y;
      player.angle = data.angle;
      player.health = data.health;
      socket.broadcast.emit('playerMoved', data);
    }
  });

  socket.on('shoot', (data: { id: string; playerId: string; x: number; y: number; direction: number }) => {
    projectiles.push(data);
    socket.broadcast.emit('shoot', data);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

function checkForCollisions() {
  for (let projectile of projectiles) {
    for (let player of players) {
      if (projectile.playerId === player.id) continue; // Skip self-collision
      const p: Point = { x: projectile.x, y: projectile.y };
      const rect: Rect = { x: player.x, y: player.y, width: 200, height: 120, angle: player.angle };
      if (collisionDetectionPointRectServer(p, rect)) {
        if (player.health > 0) {
          player.health -= 20; // Reduce health by 20 on hit
        }
        if (player.health < 0) players = players.filter(p => p.id !== player.id); // Remove player if health drops below 0
        io.emit('playerHit', { playerId: player.id, projectileId: projectile.id });
        projectiles = projectiles.filter(pr => pr !== projectile);
      }
    }
  }
}

function updateProjectiles() {
  for (let projectile of projectiles) {
    projectile.x += Math.cos(degreesToRadians(projectile.direction)) * PROJECTILE_SPEED;
    projectile.y += Math.sin(degreesToRadians(projectile.direction)) * PROJECTILE_SPEED;
  }
}

function serverLoop() {
  updateProjectiles();
  checkForCollisions();
}

setInterval(serverLoop, 30); // Run server loop every 30 ms