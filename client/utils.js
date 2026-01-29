// Canvas setup
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

function drawCircle(x, y, r, colorFill, colorStroke) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI, false);
    ctx.fillStyle = colorFill;
    ctx.fill();
    if (colorStroke) {
        ctx.strokeStyle = colorStroke;
        ctx.stroke();
    }
    ctx.closePath();
}

// Key events
const KEY_CODES = {
    UP: 'ArrowUp',
    DOWN: 'ArrowDown',
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    SPACE: "Space",
    W: 'KeyW',
    A: 'KeyA',
    S: 'KeyS',
    D: 'KeyD'
};

let isKeyPressed = [];
window.addEventListener("keydown", (event) => {
    isKeyPressed[event.code] = true;
});

window.addEventListener("keyup", (event) => {
    isKeyPressed[event.code] = false;
});

function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}

const orangeTankImg = new Image();
orangeTankImg.src = 'assets/orange_tank.png';

const blueTankImg = new Image();
blueTankImg.src = 'assets/blue_tank.png';

const playerImages = {
    'orange': orangeTankImg,
    'blue': blueTankImg
};

function collisionDetectionPointRect(point, rect) {
    const deltaX = point.x - rect.x;
    const deltaY = point.y - rect.y;
    const currAngle = Math.atan2(deltaY, deltaX);
    const newAngle = currAngle - rect.angle * Math.PI / 180;
    const r = Math.hypot(deltaX, deltaY);

    const projectedPoint = {
        x: rect.x + r * Math.cos(newAngle),
        y: rect.y + r * Math.sin(newAngle)
    };

    return (projectedPoint.x > rect.x - rect.width / 2 &&
            projectedPoint.x < rect.x + rect.width / 2 &&
            projectedPoint.y > rect.y - rect.height / 2 &&
            projectedPoint.y < rect.y + rect.height / 2);
}

function drawHPBar(hp) {
    const startX = 10, startY = 10;
    const greenHSV = {h: 120, s: 0.66, v: 1.0};
    
    for (let i = 0; i < hp; i++) {
        ctx.fillStyle = `hsl(${greenHSV.h * (hp/100)}, ${greenHSV.s * 100}%, ${greenHSV.v * 50}%)`;
        ctx.fillRect(startX + i * 4, startY, 3, 5);
    }
}