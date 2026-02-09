export interface Point {
    x: number;
    y: number;
}

export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
    angle: number;
}

export interface Player {
    id: string;
    x: number;
    y: number;
    angle: number;
    health: number;
    color: string;
}

export interface Projectile {
    id: string;
    playerId: string;
    x: number;
    y: number;
    direction: number;
    color: string;
}

export interface Cover {
    id: string;
    x: number;
    y: number;
    angle: number;
    length: number;
}