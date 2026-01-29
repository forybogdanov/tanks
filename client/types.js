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
    constructor(id, x, y, angle) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.angle = angle; // in degrees
        this.color = "blue";
        this.type = "player";
        this.cooldown = 0;
        this.hp = 100;
    }
    draw() {
        drawImage(playerImages[this.color], this.x, this.y, 200, 120, this.angle);
    }
    handleMovement() {
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

class Enemy {
    constructor(id, x, y, angle) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.angle = angle; // in degrees
        this.color = "orange";
        this.type = "enemy";
        this.cooldown = 0;
        this.hp = 100;
    }
    draw() {
        drawImage(playerImages[this.color], this.x, this.y, 200, 120, this.angle);
    }
    handleMovement() {}
}