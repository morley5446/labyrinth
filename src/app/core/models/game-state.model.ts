import { Tile, ShiftPosition } from './tile.model';
import { Player } from './player.model';

export type GamePhase = 'setup' | 'shift' | 'move' | 'game-over';
export type AiSpeed = 'slow' | 'normal' | 'fast';

export interface GameSettings {
  showReachableFields: boolean;
  aiSpeed: AiSpeed;
}

export interface CollectedEvent {
  playerId: number;
  treasure: string;
  tileRow: number;
  tileCol: number;
}

export interface GameState {
  board: Tile[][];
  spareTile: Tile;
  players: Player[];
  currentPlayerIndex: number;
  phase: GamePhase;
  lastShift: ShiftPosition | null;
  lastCollected: CollectedEvent | null;
  settings: GameSettings;
  winner: Player | null;
}
