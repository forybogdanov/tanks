const socket = io();

let objects = [];
let player;
let covers = [];

resizeCanvas();

socket.emit('loginRequest', {});
socket.on('userLogin', (data) => {
    const { players, newPlayer, covers: coversFromServer } = data;
    covers = coversFromServer;
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
    let projectile = new Projectile(id, x, y, direction, "orange");
    objects.push(projectile);
});

socket.on('playerHit', (data) => {
    const { playerId, projectileId } = data;
    objects = objects.filter(object => object.id !== projectileId);
    const playerHit = objects.find(object => object.id === playerId);
    if (playerHit) {
        playerHit.hp -= PROJECTILE_POWER;
        if (playerHit.hp <= 0) {
            if (playerHit.id === player.id) player.handleDeath();
            handleDieSound();
            objects = objects.filter(object => object.id !== playerId);
        }
    }
    handleHitSound();
});

function drawUI() {
    drawHPBarPlayer(player.hp);
}

function drawCovers() {
    for (let cover of covers) {
        drawRect(cover.x, cover.y, COVER_WIDTH, cover.length, cover.angle, COVER_COLOR);
    }
}

function checkCollisions() {
    let isBlocked = false;
    for (let cover of covers) {
        if (collisionDetectionPlayerCover(player, cover)) {
            isBlocked = true;
            break;
        }

        for (let projectile of objects.filter(obj => obj.type === "projectile")) {
            const p = { x: projectile.x, y: projectile.y };
            const rect = { x: cover.x, y: cover.y, width: COVER_WIDTH, height: cover.length, angle: cover.angle };
            if (collisionDetectionPointRect(p, rect)) {
                objects = objects.filter(obj => obj !== projectile);
                break;
            }
        }
    }
    player.isBlocked = isBlocked;
}

function drawShadows() {
    for (let cover of covers) {
        const coverPoint1 = {x: cover.x + Math.sin(degreesToRadians(cover.angle)) * cover.length/2,
         y: cover.y - Math.cos(degreesToRadians(cover.angle)) * cover.length/2};
        const coverPoint2 = {x: cover.x - Math.sin(degreesToRadians(cover.angle)) * cover.length/2,
            y: cover.y + Math.cos(degreesToRadians(cover.angle)) * cover.length/2};

        let shadowPoints = [];
        shadowPoints.push({ x: coverPoint1.x, y: coverPoint1.y });
        shadowPoints.push({ x: coverPoint2.x, y: coverPoint2.y });
        const shadowPoint3 = findShadowPoints({x: player.x, y: player.y}, coverPoint1);
        const shadowPoint4 = findShadowPoints({x: player.x, y: player.y}, coverPoint2);

        if (shadowPoint3 && shadowPoint4) {
        if (shadowPoint3.edge != shadowPoint4.edge) {
            if (shadowPoint4) shadowPoints.push(shadowPoint4);
            const edges = [shadowPoint3.edge, shadowPoint4.edge];
            if (edges.includes("left") && edges.includes("top")) {
                shadowPoints.push({ x: 0, y: 0 });
            } else if (edges.includes("left") && edges.includes("bottom")) {
                shadowPoints.push({ x: 0, y: canvas.height });
            } else if (edges.includes("right") && edges.includes("top")) {
                shadowPoints.push({ x: canvas.width, y: 0 });
            } else if (edges.includes("right") && edges.includes("bottom")) {
                shadowPoints.push({ x: canvas.width, y: canvas.height });
            } else if (edges.includes("left") && edges.includes("right")) {
                // to be determined based on player's position
            } else if (edges.includes("top") && edges.includes("bottom")) {
                // to be determined based on player's position
            }
            if (shadowPoint3) shadowPoints.push(shadowPoint3);
        } else {
            if (shadowPoint4) shadowPoints.push(shadowPoint4);
            if (shadowPoint3) shadowPoints.push(shadowPoint3);
        }
            drawPolygon(shadowPoints.map(p => ({ x: p.x, y: p.y })), SHADOWS_COLOR);
        }
    }
}

function gameLoop() {
    clearCanvas();

    checkCollisions();
    
    for (let object of objects) {
        object.handleMovement();
        object.draw();
    }
    drawCovers(covers);
    drawShadows();
    drawUI();
}

setInterval(gameLoop, 30);