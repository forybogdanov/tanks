const ROTATION_SPEED = 3;
const FORWARD_SPEED = 5;

const PROJECTILE_SPEED = 10;
const PROJECTILE_RADIUS = 8;

const SHOOT_COOLDOWN = 30; // frames

const socket = io();

let objects = [];
let player;

class Projectile {
    constructor(x, y, direction, color) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.color = color;
        this.type = "projectile";
    }
    draw() {
        drawCircle(this.x, this.y, PROJECTILE_RADIUS, this.color, "white");
    }
    handleMovement() {
        this.x += Math.cos(degreesToRadians(this.direction)) * PROJECTILE_SPEED;
        this.y += Math.sin(degreesToRadians(this.direction)) * PROJECTILE_SPEED;
    }
};

class Player {
    constructor(id, x, y, angle, color) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.angle = angle; // in degrees
        this.color = "blue";
        this.type = "player";
        this.cooldown = 0;
    }
    draw() {
        drawImage(playerImages[this.color], this.x, this.y, 200, 120, this.angle);
    }
    handleControls() {
        this.cooldown--;
        if (this.cooldown < 0) this.cooldown = 0;
        if (isKeyPressed[KEY_CODES.LEFT] || isKeyPressed[KEY_CODES.A]) {
            this.angle -= ROTATION_SPEED;
            if (this.angle < 0) this.angle +=360;
        }
        if (isKeyPressed[KEY_CODES.RIGHT] || isKeyPressed[KEY_CODES.D]) {
            this.angle += ROTATION_SPEED;
            if (this.angle > 360) this.angle -= 360;
        }
        if (isKeyPressed[KEY_CODES.UP] || isKeyPressed[KEY_CODES.W]) {
            this.x += Math.cos(degreesToRadians(this.angle)) * FORWARD_SPEED;
            this.y += Math.sin(degreesToRadians(this.angle)) * FORWARD_SPEED;
        }
        if (isKeyPressed[KEY_CODES.DOWN] || isKeyPressed[KEY_CODES.S]) {
            this.x -= Math.cos(degreesToRadians(this.angle)) * FORWARD_SPEED;
            this.y -= Math.sin(degreesToRadians(this.angle)) * FORWARD_SPEED;
        }
        if (isKeyPressed[KEY_CODES.SPACE] && this.cooldown === 0) {
            let projX = this.x + Math.cos(degreesToRadians(this.angle)) * 60;
            let projY = this.y + Math.sin(degreesToRadians(this.angle)) * 60;
            let projectile = new Projectile(projX, projY, this.angle, "blue");
            socket.emit('shoot', { id: this.id, x: projX, y: projY, direction: this.angle });
            objects.push(projectile);
            this.cooldown = SHOOT_COOLDOWN;
            isKeyPressed[KEY_CODES.SPACE] = false;
        }
    }
}

class Enemy extends Player {
    constructor(id, x, y, angle, color) {
        super(id, x, y, angle, color);
        this.type = "enemy";
        this.color = 'orange';
    }
}

socket.emit('loginRequest', {});
socket.on('userLogin', (data) => {
    console.log(data);
    const { players, newPlayer } = data;
    player = new Player(newPlayer.id, newPlayer.x, newPlayer.y, newPlayer.angle);
    objects.push(player);
    for (let p of players) {
        if (p.id !== newPlayer.id) {
            let otherPlayer = new Enemy(p.id, p.x, p.y, p.angle);
            objects.push(otherPlayer);
        }
    }
});

socket.on('playerMoved', (data) => {
    const { id, x, y, angle } = data;
    for (let object of objects) {
        if (object.id === id && object.type === "enemy") {
            object.x = x;
            object.y = y;
            object.angle = angle;
            break;
        }
    }
});

socket.on('newPlayer', (data) => {
    const { id, x, y, angle } = data;
    let newEnemy = new Enemy(id, x, y, angle);
    objects.push(newEnemy);
});

socket.on('playerDisconnected', (id) => {
    objects = objects.filter(object => object.id !== id);
});

window.addEventListener("beforeunload", () => {
    socket.emit('disconnect', { id: player.id });
});

socket.on('shoot', (data) => {
    const { id, x, y, direction } = data;
    let projectile = new Projectile(x, y, direction, "orange");
    objects.push(projectile);
});

function gameLoop() {
    clearCanvas();
    for (let object of objects) {
        if (object.type === "player") object.handleControls();
        if (object.type === "projectile") object.handleMovement();
        object.draw();
        socket.emit('move', { id: object.id, x: object.x, y: object.y, angle: object.angle } );
    }
}

setInterval(gameLoop, 30);