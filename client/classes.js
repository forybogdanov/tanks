class Projectile {
    constructor(id, x, y, direction, color) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.color = color;
        this.type = "projectile";
        this.ticksFromLastMove = 0;
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
        this.hp = MAX_HP;
    }
    draw() {
        drawHPBarOverTank(this.hp, this.x - PLAYER_WIDTH / 2 , this.y - PLAYER_HEIGHT / 2 - 30);
        drawImage(playerImages[this.color], this.x, this.y, PLAYER_WIDTH, PLAYER_HEIGHT, this.angle);
    }
    handleMoveSound() {
        if (!document.getElementById('moveSound')) {
                const element = document.createElement('audio');
                element.setAttribute('src', 'assets/move_sound.mp3');
                element.setAttribute('loop', 'true');
                element.setAttribute('id', 'moveSound');
                element.volume = SOUNDS_VOLUME;
                document.body.appendChild(element);
                element.play();
            } else {
                const moveSound = document.getElementById('moveSound');
                if (moveSound.paused) {
                    moveSound.play();
                }
            }
    }
    handleShootSound() {
        const element = document.createElement('audio');
        element.setAttribute('src', 'assets/shoot_sound.mp3');
        element.play();
        element.volume = SOUNDS_VOLUME;
        document.body.appendChild(element);
        element.addEventListener('ended', () => {
            document.body.removeChild(element);
        });
    }
    handleHitSound() {
        const element = document.createElement('audio');
        element.setAttribute('src', 'assets/hit_sound.mp3');
        element.play();
        element.volume = SOUNDS_VOLUME;
        document.body.appendChild(element);
    }
    handleMovement() {
        let hasMoved = false;
        this.cooldown--;
        if (this.cooldown < 0) this.cooldown = 0;
        if (isKeyPressed[KEY_CODES.LEFT] || isKeyPressed[KEY_CODES.A]) {
            this.angle -= ROTATION_SPEED;
            if (this.angle < 0) this.angle +=360;
            hasMoved = true;
        }
        if (isKeyPressed[KEY_CODES.RIGHT] || isKeyPressed[KEY_CODES.D]) {
            this.angle += ROTATION_SPEED;
            if (this.angle > 360) this.angle -= 360;
            hasMoved = true;
        }
        if (isKeyPressed[KEY_CODES.UP] || isKeyPressed[KEY_CODES.W]) {
            this.x += Math.cos(degreesToRadians(this.angle)) * FORWARD_SPEED;
            this.y += Math.sin(degreesToRadians(this.angle)) * FORWARD_SPEED;
            hasMoved = true;
        }
        if (isKeyPressed[KEY_CODES.DOWN] || isKeyPressed[KEY_CODES.S]) {
            this.x -= Math.cos(degreesToRadians(this.angle)) * FORWARD_SPEED;
            this.y -= Math.sin(degreesToRadians(this.angle)) * FORWARD_SPEED;
            hasMoved = true;
        }
        if (isKeyPressed[KEY_CODES.SPACE] && this.cooldown === 0) {
            let projX = this.x + Math.cos(degreesToRadians(this.angle)) * 60;
            let projY = this.y + Math.sin(degreesToRadians(this.angle)) * 60;
            let projectileId = `proj_${Date.now()}_${Math.random()}`
            let projectile = new Projectile(projectileId, projX, projY, this.angle, "blue");
            socket.emit('shoot', { id: projectileId, playerId: this.id, x: projX, y: projY, direction: this.angle });
            objects.push(projectile);
            this.cooldown = SHOOT_COOLDOWN;
            isKeyPressed[KEY_CODES.SPACE] = false;

            this.handleShootSound();
        }
        if (this.ticksFromLastMove > TICKS_TO_STOP_MOVING_SOUND) {
            const moveSound = document.getElementById('moveSound');
            if (moveSound) {
                moveSound.pause();
            }
        }

        if (hasMoved) {
            socket.emit('move', { id: this.id, x: this.x, y: this.y, angle: this.angle } );
            this.ticksFromLastMove = 0;
            this.handleMoveSound();
        } else {
            this.ticksFromLastMove++;
        }
    }
    handleDeath() {
        const el = document.getElementById('moveSound');
        if (el) {
            el.pause();
            document.body.removeChild(el);
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
        this.hp = MAX_HP;
    }
    draw() {
        drawHPBarOverTank(this.hp, this.x - PLAYER_WIDTH / 2 , this.y - PLAYER_HEIGHT / 2 - 30);
        drawImage(playerImages[this.color], this.x, this.y, PLAYER_WIDTH, PLAYER_HEIGHT, this.angle);
    }
    handleMovement() {}
}