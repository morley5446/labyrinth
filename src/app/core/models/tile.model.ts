import { TreasureId } from './treasure.model';

export type TileType = 'straight' | 'curve' | 'T';
export type Rotation = 0 | 90 | 180 | 270;

export interface TilePaths {
  north: boolean;
  east: boolean;
  south: boolean;
  west: boolean;
}

export interface Tile {
  type: TileType;
  rotation: Rotation;
  treasure: TreasureId | null;
  paths: TilePaths;
}

export type ShiftRow = 1 | 3 | 5;
export type ShiftCol = 1 | 3 | 5;
export type ShiftDirection = 'left' | 'right' | 'up' | 'down';

export interface ShiftPosition {
  direction: ShiftDirection;
  index: ShiftRow | ShiftCol;
}
