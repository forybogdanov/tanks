import { Point, Rect } from "./types";

export function collisionDetectionPointRectServer(point: Point, rect: Rect) {
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

export function degreesToRadians(degrees: number) {
    return degrees * Math.PI / 180;
}