import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { collisionDetectionPointRectServer, degreesToRadians } from './utils';
import { Point, Rect, Player, Projectile, Cover } from './types';

const PROJECTILE_SPEED = 10;
const PROJECTILE_RADIUS = 8;
const PROJECTILE_LIFETIME_MS = 10000;

const SPAWN_POINTS = [
  { x: 50, y: 50 },   // Top-left corner
  { x: 800, y: 600 },   // Top-right corner
  { x: 50, y: 500 },   // Bottom-left corner
  { x: 800, y: 50 }    // Bottom-right corner
];

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

let players: Player[] = [];
let projectiles: Projectile[] = [];
const covers: Cover[] = [
  { id: 'cover1', x: 500, y: 300, angle: 45, length: 250 },
  { id: 'cover2', x: 900, y: 150, angle: 0, length: 250 },
  { id: 'cover3', x: 900, y: 450, angle: 90, length: 250 }
]

app.use(express.static('client'));

io.on('connection', (socket) => {

  socket.on('loginRequest', () => {
    const id = socket.id;
    const spawnPoint = SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)];
    const newPlayer: Player = { id, x: spawnPoint.x, y: spawnPoint.y, angle: Math.random() * 360, health: 100, color: ['orange', 'blue', 'red', 'green'][Math.floor(Math.random() * 4)] };
    socket.emit('userLogin', {players, newPlayer, covers});
    socket.broadcast.emit('newPlayer', newPlayer);
    players.push(newPlayer);
  });

  socket.on('disconnect', () => {
    players = players.filter(p => p.id !== socket.id);
    socket.broadcast.emit('playerDisconnected', socket.id);
  });

  socket.on('move', (data: Player) => {
    const player = players.find(p => p.id === data.id);
    if (player) {
      player.x = data.x;
      player.y = data.y;
      player.angle = data.angle;
      player.health = data.health;
      socket.broadcast.emit('playerMoved', data);
    }
  });

  socket.on('shoot', (data: Omit<Projectile, 'createdAt'>) => {
    const projectileWithTimestamp: Projectile = { ...data, createdAt: new Date() };
    projectiles.push(projectileWithTimestamp);
    socket.broadcast.emit('shoot', projectileWithTimestamp);
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
          player.health -= 20; // Reduce health by 20 on hit
        if (player.health <= 0) {
          players = players.filter(p => p.id !== player.id);
         } // Remove player if health drops below 0
        io.emit('playerHit', { playerId: player.id, projectileId: projectile.id });
        projectiles = projectiles.filter(pr => pr !== projectile);
      }
    }

    for (let cover of covers) {
      const p: Point = { x: projectile.x, y: projectile.y };
      const rect: Rect = { x: cover.x, y: cover.y, width: 10, height: cover.length, angle: cover.angle };
      if (collisionDetectionPointRectServer(p, rect)) {
        projectiles = projectiles.filter(pr => pr !== projectile);
        break;
      }
    }
  }
}

function updateProjectiles() {
  for (let projectile of projectiles) {
    if (new Date().getTime() - projectile.createdAt.getTime() > PROJECTILE_LIFETIME_MS) {
      projectiles = projectiles.filter(pr => pr !== projectile);
      continue;
    }
    projectile.x += Math.cos(degreesToRadians(projectile.direction)) * PROJECTILE_SPEED;
    projectile.y += Math.sin(degreesToRadians(projectile.direction)) * PROJECTILE_SPEED;
  }
}

function serverLoop() {
  updateProjectiles();
  checkForCollisions();
}

setInterval(serverLoop, 30); // Run server loop every 30 ms