import { Injectable } from '@angular/core';
import { BoardService } from './board.service';
import { GameState } from '../models/game-state.model';
import { ShiftPosition } from '../models/tile.model';
import { Position } from '../models/player.model';

interface AiMove {
  shift: ShiftPosition;
  targetPosition: Position;
}

const ALL_SHIFTS: ShiftPosition[] = [
  { direction: 'left',  index: 1 }, { direction: 'left',  index: 3 }, { direction: 'left',  index: 5 },
  { direction: 'right', index: 1 }, { direction: 'right', index: 3 }, { direction: 'right', index: 5 },
  { direction: 'up',    index: 1 }, { direction: 'up',    index: 3 }, { direction: 'up',    index: 5 },
  { direction: 'down',  index: 1 }, { direction: 'down',  index: 3 }, { direction: 'down',  index: 5 },
];

@Injectable({ providedIn: 'root' })
export class AiService {
  constructor(private board: BoardService) {}

  calculateMove(state: GameState): AiMove {
    const player = state.players[state.currentPlayerIndex];
    const difficulty = player.aiDifficulty ?? 'easy';
    const validShifts = ALL_SHIFTS.filter(s => !this.board.isReverseShift(state.lastShift, s));

    if (difficulty === 'easy') {
      const shift = validShifts[Math.floor(Math.random() * validShifts.length)];
      const { newBoard, newPlayers } = this.board.shiftTiles(state.board, state.spareTile, shift, state.players);
      const reachable = this.board.getReachablePositions(newBoard, newPlayers![state.currentPlayerIndex].position);
      const target = reachable[Math.floor(Math.random() * reachable.length)];
      return { shift, targetPosition: target };
    }

    // Medium & Hard: find shift that makes treasure reachable
    let bestMove: AiMove | null = null;

    for (const shift of validShifts) {
      const { newBoard, newPlayers } = this.board.shiftTiles(
        state.board, state.spareTile, shift, state.players
      );
      const aiPlayer = newPlayers![state.currentPlayerIndex];
      const reachable = this.board.getReachablePositions(newBoard, aiPlayer.position);
      const targetTreasure = player.cards[0];

      const treasurePos = reachable.find(p => newBoard[p.row][p.col].treasure === targetTreasure);
      if (treasurePos) {
        bestMove = { shift, targetPosition: treasurePos };
        break; // take first found (both medium and hard for simplicity)
      }

      if (!bestMove) {
        const furthest = reachable.reduce((best, pos) => {
          const dist = Math.abs(pos.row - aiPlayer.position.row) + Math.abs(pos.col - aiPlayer.position.col);
          const bestDist = Math.abs(best.row - aiPlayer.position.row) + Math.abs(best.col - aiPlayer.position.col);
          return dist > bestDist ? pos : best;
        }, aiPlayer.position);
        bestMove = { shift, targetPosition: furthest };
      }
    }

    return bestMove ?? { shift: validShifts[0], targetPosition: player.position };
  }
}
