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