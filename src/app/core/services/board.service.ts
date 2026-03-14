import { Injectable } from '@angular/core';
import { Tile, TileType, Rotation, TilePaths, ShiftPosition } from '../models';
import { ALL_TREASURES, TreasureId } from '../models';
import { Player, PlayerId, PlayerColor, Position } from '../models';

// Base paths before rotation (rotation 0)
const BASE_PATHS: Record<TileType, TilePaths> = {
  straight: { north: true, east: false, south: true, west: false },
  curve:    { north: true, east: true,  south: false, west: false },
  T:        { north: true, east: true,  south: false, west: true  },
};

// Fixed tile definitions: [row, col, type, rotation, treasure?]
const FIXED_TILES: [number, number, TileType, Rotation, TreasureId | null][] = [
  [0, 0, 'curve', 90,  null],       // top-left corner
  [0, 2, 'T',     180, 'bat'],
  [0, 4, 'T',     180, 'book'],
  [0, 6, 'curve', 180, null],       // top-right corner
  [2, 0, 'T',     90,  'gnome'],
  [2, 2, 'T',     90,  'candle'],
  [2, 4, 'T',     180, 'fairy'],
  [2, 6, 'T',     270, 'dragon'],
  [4, 0, 'T',     90,  'owl'],
  [4, 2, 'T',     0,   'ghost'],
  [4, 4, 'T',     270, 'witch'],
  [4, 6, 'T',     270, 'spider'],
  [6, 0, 'curve', 0,   null],       // bottom-left corner
  [6, 2, 'T',     0,   'keys'],
  [6, 4, 'T',     0,   'skull'],
  [6, 6, 'curve', 270, null],       // bottom-right corner
];

// Start positions per player
const START_POSITIONS: Record<PlayerId, Position> = {
  1: { row: 0, col: 0 },
  2: { row: 0, col: 6 },
  3: { row: 6, col: 6 },
  4: { row: 6, col: 0 },
};

const PLAYER_COLORS: PlayerColor[] = ['red', 'blue', 'green', 'yellow'];

@Injectable({ providedIn: 'root' })
export class BoardService {

  computePaths(type: TileType, rotation: Rotation): TilePaths {
    const base = BASE_PATHS[type];
    const dirs: (keyof TilePaths)[] = ['north', 'east', 'south', 'west'];
    const steps = rotation / 90;
    const result: TilePaths = { north: false, east: false, south: false, west: false };
    dirs.forEach((dir, i) => {
      const rotatedIndex = (i + steps) % 4;
      result[dirs[rotatedIndex]] = base[dir];
    });
    return result;
  }

  private randomRotation(): Rotation {
    const rotations: Rotation[] = [0, 90, 180, 270];
    return rotations[Math.floor(Math.random() * 4)];
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  initializeBoard(playerCount: number): { board: Tile[][], spareTile: Tile } {
    const fixedMap = new Map<string, Tile>();
    const fixedTreasures = new Set<TreasureId>();

    for (const [r, c, type, rotation, treasure] of FIXED_TILES) {
      if (treasure) fixedTreasures.add(treasure);
      fixedMap.set(`${r},${c}`, {
        type, rotation, treasure,
        paths: this.computePaths(type, rotation),
      });
    }

    const remainingTreasures = this.shuffle(
      ALL_TREASURES.filter(t => !fixedTreasures.has(t))
    );

    const RANDOM_TYPES: TileType[] = [
      ...Array(13).fill('straight'),
      ...Array(11).fill('curve'),
      ...Array(10).fill('T'),
    ];
    const shuffledTypes = this.shuffle(RANDOM_TYPES);

    const randomTiles: Tile[] = shuffledTypes.map((type, i) => {
      const rotation = this.randomRotation();
      const treasure = i < remainingTreasures.length ? remainingTreasures[i] : null;
      return { type, rotation, treasure, paths: this.computePaths(type, rotation) };
    });

    const board: Tile[][] = Array.from({ length: 7 }, () => Array(7).fill(null));
    let randomIndex = 0;

    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const fixed = fixedMap.get(`${r},${c}`);
        board[r][c] = fixed ?? randomTiles[randomIndex++];
      }
    }

    const spareTile = randomTiles[randomIndex];
    return { board, spareTile };
  }

  shiftTiles(
    board: Tile[][],
    spare: Tile,
    shift: ShiftPosition,
    players?: Player[]
  ): { newBoard: Tile[][], newSpare: Tile, newPlayers?: Player[] } {
    const newBoard = board.map(row => [...row]);
    let newSpare: Tile;
    let newPlayers = players ? players.map(p => ({ ...p, position: { ...p.position } })) : undefined;

    const { direction, index } = shift;

    if (direction === 'left') {
      newSpare = newBoard[index][6];
      for (let c = 6; c > 0; c--) newBoard[index][c] = newBoard[index][c - 1];
      newBoard[index][0] = spare;
      newPlayers?.forEach(p => {
        if (p.position.row === index) {
          p.position.col = p.position.col === 6 ? 0 : p.position.col + 1;
        }
      });
    } else if (direction === 'right') {
      newSpare = newBoard[index][0];
      for (let c = 0; c < 6; c++) newBoard[index][c] = newBoard[index][c + 1];
      newBoard[index][6] = spare;
      newPlayers?.forEach(p => {
        if (p.position.row === index) {
          p.position.col = p.position.col === 0 ? 6 : p.position.col - 1;
        }
      });
    } else if (direction === 'up') {
      newSpare = newBoard[6][index];
      for (let r = 6; r > 0; r--) newBoard[r][index] = newBoard[r - 1][index];
      newBoard[0][index] = spare;
      newPlayers?.forEach(p => {
        if (p.position.col === index) {
          p.position.row = p.position.row === 6 ? 0 : p.position.row + 1;
        }
      });
    } else { // down
      newSpare = newBoard[0][index];
      for (let r = 0; r < 6; r++) newBoard[r][index] = newBoard[r + 1][index];
      newBoard[6][index] = spare;
      newPlayers?.forEach(p => {
        if (p.position.col === index) {
          p.position.row = p.position.row === 0 ? 6 : p.position.row - 1;
        }
      });
    }

    return { newBoard, newSpare: newSpare!, newPlayers };
  }

  isReverseShift(last: ShiftPosition | null, current: ShiftPosition): boolean {
    if (!last) return false;
    const reverseDir: Record<string, string> = {
      left: 'right', right: 'left', up: 'down', down: 'up'
    };
    return last.index === current.index && reverseDir[last.direction] === current.direction;
  }

  initializePlayers(configs: { name: string; isAI: boolean; aiDifficulty?: any }[], playerCount: number): Player[] {
    return configs.slice(0, playerCount).map((config, i) => {
      const id = (i + 1) as PlayerId;
      const allCards = this.shuffle(ALL_TREASURES);
      const cardsPerPlayer = Math.floor(ALL_TREASURES.length / playerCount);
      return {
        id,
        name: config.name,
        color: PLAYER_COLORS[i],
        isAI: config.isAI,
        aiDifficulty: config.aiDifficulty,
        position: { ...START_POSITIONS[id] },
        startPosition: { ...START_POSITIONS[id] },
        cards: allCards.slice(i * cardsPerPlayer, (i + 1) * cardsPerPlayer),
        collectedCards: [],
      };
    });
  }
}
