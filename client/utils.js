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

const playerImages = {
    'orange': orangeTankImg,
    'blue': blueTankImg
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

function createLine(p1, p2) {
    // p1 and p2 should be objects: {x: 1, y: 2}
    
    let A = p1.y - p2.y;
    let B = p2.x - p1.x;

    const C = -(A * p1.x + B * p1.y);

    return {
        A, B, C,
        testPoint: function(px, py) {
            return A * px + B * py + C;
        }
    };
}

function segmentsCrossing(pointA1, pointA2, pointB1, pointB2) {
    const lineA = createLine(pointA1, pointA2);
    const lineB = createLine(pointB1, pointB2);
    return (lineA.testPoint(pointB1.x, pointB1.y) * lineA.testPoint(pointB2.x, pointB2.y) < 0) &&
           (lineB.testPoint(pointA1.x, pointA1.y) * lineB.testPoint(pointA2.x, pointA2.y) < 0);
}

function collisionDetectionPlayerCover(player, cover) {
    const t = Math.hypot(PLAYER_WIDTH/2, PLAYER_HEIGHT/2);
    const alpha = Math.sin(PLAYER_HEIGHT/2/t);

    const angle1 = degreesToRadians(player.angle) - alpha;
    const angle2 = degreesToRadians(player.angle) + alpha;
    const angle3 = degreesToRadians(player.angle) - alpha + Math.PI;
    const angle4 = degreesToRadians(player.angle) + alpha + Math.PI;

    const frontLeft = {x: player.x + t * Math.cos(angle1), y: player.y + t * Math.sin(angle1) };
    const frontRight = {x: player.x + t * Math.cos(angle2), y: player.y + t * Math.sin(angle2) };
    const backLeft = {x: player.x + t * Math.cos(angle3), y: player.y + t * Math.sin(angle3) };
    const backRight = {x: player.x + t * Math.cos(angle4), y: player.y + t * Math.sin(angle4) };
    
    const coverPoint1 = {x: cover.x + Math.sin(degreesToRadians(cover.angle)) * cover.length/2,
         y: cover.y - Math.cos(degreesToRadians(cover.angle)) * cover.length/2};
    const coverPoint2 = {x: cover.x - Math.sin(degreesToRadians(cover.angle)) * cover.length/2,
        y: cover.y + Math.cos(degreesToRadians(cover.angle)) * cover.length/2};

    if (TESTING_MODE) {
        drawCircle(frontLeft.x, frontLeft.y, 5, 'red');
        drawCircle(frontRight.x, frontRight.y, 5, 'red');
        drawCircle(backLeft.x, backLeft.y, 5, 'red');
        drawCircle(backRight.x, backRight.y, 5, 'red');
        drawCircle(coverPoint1.x, coverPoint1.y, 5, 'yellow');
        drawCircle(coverPoint2.x, coverPoint2.y, 5, 'yellow');
    }

    return segmentsCrossing(frontLeft, frontRight, coverPoint1, coverPoint2) ||
           segmentsCrossing(frontLeft, backLeft, coverPoint1, coverPoint2) ||
           segmentsCrossing(backLeft, backRight, coverPoint1, coverPoint2) ||
           segmentsCrossing(frontRight, backRight, coverPoint1, coverPoint2);
}

function findShadowPoints(playerPoint, wallPoint) {
    const left = 0;
    const right = canvas.width;
    const top = 0;
    const bottom = canvas.height;

    const crossingPoints = [];

    const dx = wallPoint.x - playerPoint.x;
    const dy = wallPoint.y - playerPoint.y;

    if (dx === 0 && dy === 0) {
        return null;
    }

    if (dx !== 0) {
        const tLeft = (left - playerPoint.x) / dx;
        const yAtLeft = playerPoint.y + tLeft * dy;
        if (yAtLeft >= top && yAtLeft <= bottom && tLeft > 1) {
            crossingPoints.push({ x: left, y: yAtLeft, edge: 'left', t: tLeft });
        }
    }

    if (dx !== 0) {
        const tRight = (right - playerPoint.x) / dx;
        const yAtRight = playerPoint.y + tRight * dy;
        if (yAtRight >= top && yAtRight <= bottom && tRight > 1) {
            crossingPoints.push({ x: right, y: yAtRight, edge: 'right', t: tRight });
        }
    }

    if (dy !== 0) {
        const tTop = (top - playerPoint.y) / dy;
        const xAtTop = playerPoint.x + tTop * dx;
        if (xAtTop >= left && xAtTop <= right && tTop > 1) {
            crossingPoints.push({ x: xAtTop, y: top, edge: 'top', t: tTop });
        }
    }

    if (dy !== 0) {
        const tBottom = (bottom - playerPoint.y) / dy;
        const xAtBottom = playerPoint.x + tBottom * dx;
        if (xAtBottom >= left && xAtBottom <= right && tBottom > 1) {
            crossingPoints.push({ x: xAtBottom, y: bottom, edge: 'bottom', t: tBottom });
        }
    }

    if (crossingPoints.length === 0) {
        return null;
    }

    crossingPoints.sort((a, b) => a.t - b.t);
    const closest = crossingPoints[0];
    return { x: closest.x, y: closest.y, edge: closest.edge };
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

function handleHitSound() {
    const element = document.createElement('audio');
    element.setAttribute('src', 'assets/hit_sound.mp3');
    element.play();
    element.volume = SOUNDS_VOLUME;
    document.body.appendChild(element);
}

function handleDieSound() {
    const element = document.createElement('audio');
    element.setAttribute('src', 'assets/die_sound.mp3');
    element.play();
    element.volume = SOUNDS_VOLUME;
    document.body.appendChild(element);
}