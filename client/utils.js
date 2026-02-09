// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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

const redTankImg = new Image();
redTankImg.src = 'assets/red_tank.png';

const greenTankImg = new Image();
greenTankImg.src = 'assets/green_tank.png';

const playerImages = {
    'orange': orangeTankImg,
    'blue': blueTankImg,
    'red': redTankImg,
    'green': greenTankImg
};

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // background color
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    window.addEventListener('resize', resizeCanvas);
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = BACKGROUND_COLOR;
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

function drawRect(x, y, width, height, rotationDegrees = 0, colorFill, colorStroke) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(degreesToRadians(rotationDegrees));
    ctx.fillStyle = colorFill;
    ctx.fillRect(-width / 2, -height / 2, width, height);
    if (colorStroke) {
        ctx.strokeStyle = colorStroke;
        ctx.stroke();
    }
    ctx.restore();
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

function drawPolygon(points, colorFill, colorStroke) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = colorFill;
    ctx.fill();
    if (colorStroke) {
        ctx.strokeStyle = colorStroke;
        ctx.stroke();
    }
}

function drawHPBarPlayer(hp) {
    const startX = 10, startY = 10;
    const greenHSV = {h: 120, s: 0.66, v: 1.0};
    
    for (let i = 0; i < hp; i++) {
        ctx.fillStyle = `hsl(${greenHSV.h * (hp/100)}, ${greenHSV.s * 100}%, ${greenHSV.v * 50}%)`;
        ctx.fillRect(startX + i * 4, startY, 3, 5);
    }
}

function drawHPBarOverTank(hp, x, y) {
    const greenHSV = {h: 120, s: 0.66, v: 1.0};
    ctx.fillStyle = `hsl(${greenHSV.h * (hp/100)}, ${greenHSV.s * 100}%, ${greenHSV.v * 50}%)`;
    ctx.fillRect(x, y, 100 * (hp/100), 5);
}

function drawUI() {
    drawHPBarPlayer(player.hp);
}

function drawCovers() {
    for (let cover of covers) {
        drawRect(cover.x, cover.y, COVER_WIDTH, cover.length, cover.angle, COVER_COLOR);
    }
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
                if (player.y > cover.y) {
                    shadowPoints.push({ x: 0, y: 0 });
                    shadowPoints.push({ x: canvas.width, y: 0 });
                } else {
                    shadowPoints.push({ x: 0, y: canvas.height });
                    shadowPoints.push({ x: canvas.width, y: canvas.height });
                }
            } else if (edges.includes("top") && edges.includes("bottom")) {
                if (player.x > cover.x) {
                    shadowPoints.push({ x: 0, y: 0 });
                    shadowPoints.push({ x: 0, y: canvas.height });
                } else {                    
                    shadowPoints.push({ x: canvas.width, y: 0 });
                    shadowPoints.push({ x: canvas.width, y: canvas.height });
                }
            }
            if (shadowPoint3) shadowPoints.push(shadowPoint3);
        } else {
            if (shadowPoint4) shadowPoints.push(shadowPoint4);
            if (shadowPoint3) shadowPoints.push(shadowPoint3);
        }
            const centerPoint = shadowPoints.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
            centerPoint.x /= shadowPoints.length;
            centerPoint.y /= shadowPoints.length;
            shadowPoints.sort((a, b) => Math.atan2(a.y - centerPoint.y, a.x - centerPoint.x) - Math.atan2(b.y - centerPoint.y, b.x - centerPoint.x));
            drawPolygon(shadowPoints.map(p => ({ x: p.x, y: p.y })), SHADOWS_COLOR);
        }
    }
}
