const ROTATION_SPEED = 3;
const FORWARD_SPEED = 5;

const PROJECTILE_SPEED = 10;
const PROJECTILE_RADIUS = 8;

let objects = [];

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
        this.color = color;
        this.type = "player";
    }
    draw() {
        drawImage(playerImages[this.color], this.x, this.y, 200, 120, this.angle);
    }
    handleControls() {
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
        if (isKeyPressed[KEY_CODES.SPACE]) {
            let projX = this.x + Math.cos(degreesToRadians(this.angle)) * 60;
            let projY = this.y + Math.sin(degreesToRadians(this.angle)) * 60;
            let projectile = new Projectile(projX, projY, this.angle, "yellow");
            objects.push(projectile);
            isKeyPressed[KEY_CODES.SPACE] = false;
        }
    }
}

const socket = io();

let player;

socket.emit('loginRequest', {});
socket.on('userLogin', (data) => {
    console.log(data);
    const { players, newPlayer } = data;
    player = new Player(newPlayer.id, newPlayer.x, newPlayer.y, newPlayer.angle, "orange");
    objects.push(player);
    for (let p of players) {
        if (p.id !== newPlayer.id) {
            let otherPlayer = new Player(p.id, p.x, p.y, p.angle, "orange");
            objects.push(otherPlayer);
        }
    }
});



function gameLoop() {
    clearCanvas();
    for (let object of objects) {
        if (object.type === "player") object.handleControls();
        if (object.type === "projectile") object.handleMovement();
        object.draw();
    }
}

setInterval(gameLoop, 30);