import { TreasureId } from './treasure.model';

export type PlayerId = 1 | 2 | 3 | 4;
export type PlayerColor = 'red' | 'blue' | 'green' | 'yellow';
export type AiDifficulty = 'easy' | 'medium' | 'hard';

export interface Position {
  row: number;
  col: number;
}

export interface Player {
  id: PlayerId;
  name: string;
  color: PlayerColor;
  isAI: boolean;
  aiDifficulty?: AiDifficulty;
  position: Position;
  cards: TreasureId[];
  collectedCards: TreasureId[];
  startPosition: Position;
}
