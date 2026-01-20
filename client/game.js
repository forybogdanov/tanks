const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // background color
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    window.addEventListener('resize', resizeCanvas);
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawImage(img, x, y, width, height, rotationDegrees = 0) {
    function draw() {
        const rotationRadians = rotationDegrees * Math.PI / 180;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotationRadians);
        ctx.drawImage(img, -width / 2, -height / 2, width, height);
        // ctx.strokeStyle = 'white';
        // ctx.strokeRect(- width / 2, - height / 2, width, height); // Placeholder rectangle
        // ctx.beginPath();
        // ctx.arc(0, 0, 10, 0, 2 * Math.PI);
        // ctx.stroke();
        ctx.restore();
    }
    if (!img.complete) {
        img.onload = function() {
            draw();
        };
    } else {
        draw();
    }
}

resizeCanvas();

const orangeTankImg = new Image();
orangeTankImg.src = 'assets/orange_tank.png';

playerImages = {
    'orange': orangeTankImg
};

class Player {
    constructor(id, x, y, angle) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.type = 'orange';
    }
    draw() {
        drawImage(playerImages[this.type], this.x, this.y, 200, 120, this.angle);
    }
}

let players = [];

let myPlayer = new Player('myId', 300, 300, 0);
myPlayer.draw();
players.push(myPlayer);

function gameLoop() {
    clearCanvas();
    for (let id in players) {
        players[id].draw();
    }
    players[0].angle += 2;
}

setInterval(gameLoop, 30);