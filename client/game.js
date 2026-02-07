const socket = io();

let objects = [];
let player;

resizeCanvas();

socket.emit('loginRequest', {});
socket.on('userLogin', (data) => {
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

function gameLoop() {
    clearCanvas();
    // drawCircle(300, 300, 5, 'gray');
    // console.log(collisionDetectionPointRect({x: 300, y: 300}, {x: player.x, y: player.y, width: PLAYER_WIDTH, height: PLAYER_HEIGHT, angle: player.angle}) );
    for (let object of objects) {
        object.handleMovement();
        object.draw();
    }
    drawUI();
}

setInterval(gameLoop, 30);