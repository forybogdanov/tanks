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
    let projectile = new Projectile(x, y, direction, "orange");
    objects.push(projectile);
});

function drawUI() {
    drawHPBar(player.hp);
}

function gameLoop() {
    clearCanvas();
    for (let object of objects) {
        object.handleMovement();
        object.draw();
        socket.emit('move', { id: object.id, x: object.x, y: object.y, angle: object.angle } );
    }
    drawUI();
}

setInterval(gameLoop, 30);