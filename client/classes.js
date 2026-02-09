class Projectile {
    constructor(id, x, y, direction, color) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.color = color;
        this.type = "projectile";
        this.ticksFromLastMove = 0;
        this.isBlocked = false;
        this.lastMove = null;
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
        this.cooldown = 0;
        this.hp = MAX_HP;
        this.isBlocked = false;
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
    canMoveThatWay(key) {
        if (key === KEY_CODES.LEFT || key === KEY_CODES.RIGHT) return !this.isBlocked;
        return !this.isBlocked || (this.lastMove !== key);
    }
    checkCollisions(mockPlayer) {
        let isBlocked = false;
        for (let cover of covers) {
            if (collisionDetectionPlayerCover(mockPlayer, cover)) {
                isBlocked = true;
                break;
            }
        }
        return isBlocked;
        
    }
    handleMovement() {
        let hasMoved = false;
        this.cooldown--;
        if (this.cooldown < 0) this.cooldown = 0;
        if ((isKeyPressed[KEY_CODES.LEFT] || isKeyPressed[KEY_CODES.A]) && this.canMoveThatWay(KEY_CODES.LEFT)) {
            let mockPlayer = new Player(this.id, this.x, this.y, this.angle - ROTATION_SPEED, this.color);
            mockPlayer.angle -= ROTATION_SPEED;
            if (mockPlayer.angle < 0) mockPlayer.angle +=360;
            if (this.checkCollisions(mockPlayer)) {
                this.isBlocked = true;
                return;
            }


            this.angle -= ROTATION_SPEED;
            if (this.angle < 0) this.angle +=360;
            hasMoved = true;
            this.lastMove = KEY_CODES.LEFT;
        }
        if ((isKeyPressed[KEY_CODES.RIGHT] || isKeyPressed[KEY_CODES.D]) && this.canMoveThatWay(KEY_CODES.RIGHT)) {
            let mockPlayer = new Player(this.id, this.x, this.y, this.angle + ROTATION_SPEED, this.color);
            mockPlayer.angle += ROTATION_SPEED;
            if (mockPlayer.angle > 360) mockPlayer.angle -=360;
            if (this.checkCollisions(mockPlayer)) {
                this.isBlocked = true;
                return;
            }

            this.angle += ROTATION_SPEED;
            if (this.angle > 360) this.angle -= 360;
            hasMoved = true;
            this.lastMove = KEY_CODES.RIGHT;
        }
        if ((isKeyPressed[KEY_CODES.UP] || isKeyPressed[KEY_CODES.W]) && this.canMoveThatWay(KEY_CODES.UP)) {
            let mockPlayer = new Player(this.id, this.x, this.y, this.angle, this.color);
            mockPlayer.x += Math.cos(degreesToRadians(mockPlayer.angle)) * FORWARD_SPEED;
            mockPlayer.y += Math.sin(degreesToRadians(mockPlayer.angle)) * FORWARD_SPEED;
            if (this.checkCollisions(mockPlayer)) {
                this.isBlocked = true;
                return;
            }

            this.x += Math.cos(degreesToRadians(this.angle)) * FORWARD_SPEED;
            this.y += Math.sin(degreesToRadians(this.angle)) * FORWARD_SPEED;
            hasMoved = true;
            this.lastMove = KEY_CODES.UP;
        }
        if ((isKeyPressed[KEY_CODES.DOWN] || isKeyPressed[KEY_CODES.S]) && this.canMoveThatWay(KEY_CODES.DOWN)) {
            let mockPlayer = new Player(this.id, this.x, this.y, this.angle, this.color);
            mockPlayer.x -= Math.cos(degreesToRadians(mockPlayer.angle)) * FORWARD_SPEED;
            mockPlayer.y -= Math.sin(degreesToRadians(mockPlayer.angle)) * FORWARD_SPEED;
            if (this.checkCollisions(mockPlayer)) {
                this.isBlocked = true;
                return;
            }

            this.x -= Math.cos(degreesToRadians(this.angle)) * FORWARD_SPEED;
            this.y -= Math.sin(degreesToRadians(this.angle)) * FORWARD_SPEED;
            hasMoved = true;
            this.lastMove = KEY_CODES.DOWN;
        }
        if (isKeyPressed[KEY_CODES.SPACE] && this.cooldown === 0) {
            let projX = this.x + Math.cos(degreesToRadians(this.angle)) * 60;
            let projY = this.y + Math.sin(degreesToRadians(this.angle)) * 60;
            let projectileId = `proj_${Date.now()}_${Math.random()}`
            let projectile = new Projectile(projectileId, projX, projY, this.angle, this.color);
            socket.emit('shoot', { 
                id: projectileId, 
                playerId: this.id, 
                x: projX, 
                y: projY, 
                direction: this.angle, 
                color: this.color });
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
    constructor(id, x, y, angle, color) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.angle = angle; // in degrees
        this.color = color;
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